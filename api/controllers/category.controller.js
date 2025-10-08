import { matchedData } from 'express-validator'
import Category from '../models/category.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import httpStatus from 'http-status'
import buildErrorObject from '../utils/buildErrorObject.js'
import mongoose from 'mongoose'
import { uploadFile } from '../helpers/aws-s3.js'

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

const updateAncestors = async (categoryId, session) => {
    const category = await Category.findById(categoryId).session(session);
    if (!category || !category.parentCategory) return;

    const ancestors = [];
    let currentParent = category.parentCategory;
    
    while (currentParent) {
        ancestors.push(currentParent);
        const parent = await Category.findById(currentParent).session(session);
        currentParent = parent?.parentCategory;
    }
    
    category.ancestors = ancestors;
    await category.save({ session });
};

export const createCategoryController = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const validatedData = matchedData(req);
    const { name, description, parentCategory } = validatedData;

    await session.startTransaction();


        if (parentCategory) {
      const parent = await Category.findById(parentCategory).session(session);
      if (!parent) throw buildErrorObject(httpStatus.BAD_REQUEST, "Parent category not found");
      if (!parent.isActive) throw buildErrorObject(httpStatus.BAD_REQUEST, "Parent category is not active");
    }

    let image = "";

    if (req.files?.length) {
      const [uploadedUrl] = await uploadFile(req.files);
      image = uploadedUrl;
    }

    let baseSlug = generateSlug(name);
    let slug = baseSlug;
    let suffix = 1;

    while (await Category.exists({ slug }).session(session)) {
      slug = `${baseSlug}-${suffix++}`;
    }



    const [newCategory] = await Category.create(
      [{
        name,
        slug,
        description,
        image,
        isActive: true,
        ...(parentCategory && { parentCategory }),
        ...(validatedData.city && { city: validatedData.city }),
      }],
      { session }
    );

    // Update ancestors if category is nested
    if (parentCategory) {
      await updateAncestors(newCategory._id, session);
    }

    await session.commitTransaction();

    return res.status(httpStatus.CREATED).json(
      buildResponse(httpStatus.CREATED, {
        message: "Category created successfully",
        category: newCategory,
      })
    );
  } catch (err) {
    await session.abortTransaction();
    handleError(res, err);
  } finally {
    session.endSession();
  }
};

export const getAllCategoriesController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        let { page = 1, limit = 10, search, isActive, parentCategory, city } = validatedData;

        limit = Math.min(Number(limit), 50);
        page = Number(page);

        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
            ];
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true' || isActive === true;
        }

        if (parentCategory === 'null' || parentCategory === null) {
            filter.parentCategory = null;
        } else if (parentCategory && parentCategory !== 'all') {
            filter.parentCategory = mongoose.Types.ObjectId.createFromHexString(parentCategory);
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        const options = {
            page,
            limit,
            populate: [
                {
                    path: 'parentCategory',
                    select: 'name slug city'
                },
                {
                    path: 'ancestors',
                    select: 'name slug city'
                }
            ],
            sort: { createdAt: -1 }
        };

        const categories = await Category.paginate(filter, options);

        const response = {
            docs: categories.docs,
            totalDocs: categories.totalDocs,
            limit: categories.limit,
            page: categories.page,
            totalPages: categories.totalPages,
            hasNextPage: categories.hasNextPage,
            hasPrevPage: categories.hasPrevPage,
            nextPage: categories.nextPage,
            prevPage: categories.prevPage,
            pagingCounter: categories.pagingCounter
        };

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
    } catch (err) {
        handleError(res, err);
    }
};

export const getCategoryByIdController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { categoryId } = validatedData;

        const category = await Category.findById(categoryId)
            .populate('parentCategory', 'name slug')
            .populate('ancestors', 'name slug');

        if (!category) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Category not found');
        }

        const childCategories = await Category.find({
            parentCategory: categoryId,
            isActive: true
        }).select('name slug description image isActive');

        const response = {
            ...category.toObject(),
            children: childCategories
        };

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
    } catch (err) {
        handleError(res, err);
    }
};

export const updateCategoryController = async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { categoryId, name, description, parentCategory } = validatedData;

            const category = await Category.findById(categoryId).session(session);
            if (!category) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Category not found');
            }

            if (name && name !== category.name) {
                let slug = generateSlug(name);
                let count = 0;
                let existingCategory;
                
                do {
                    if (count > 0) {
                        slug = `${generateSlug(name)}-${count}`;
                    }
                    existingCategory = await Category.findOne({ 
                        slug, 
                        _id: { $ne: categoryId } 
                    }).session(session);
                    count++;
                } while (existingCategory);

                category.slug = slug;
                category.name = name;
            }

            if (description !== undefined) {
                category.description = description;
            }

            if (validatedData.city !== undefined) {
                category.city = validatedData.city;
            }

          if(req.files && req.files.length>0){
            const imageUrls = await uploadFile(req.files)
            category.image = imageUrls[0]
          }

            if (parentCategory !== undefined) {
                if (parentCategory === null) {
                    category.parentCategory = null;
                    category.ancestors = [];
                } else {
                    if (parentCategory === categoryId.toString()) {
                        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Category cannot be its own parent');
                    }

                    const parent = await Category.findById(parentCategory).session(session);
                    if (!parent) {
                        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Parent category not found');
                    }
                    if (!parent.isActive) {
                        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Parent category is not active');
                    }

                    const isDescendant = parent.ancestors.some(ancestorId => 
                        ancestorId.toString() === categoryId.toString()
                    ) || parent.parentCategory?.toString() === categoryId.toString();

                    if (isDescendant) {
                        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Cannot set a descendant as parent category');
                    }

                    category.parentCategory = parentCategory;
                }
            }

            await category.save({ session });

            if (category.parentCategory) {
                await updateAncestors(categoryId, session);
            }

            const childCategories = await Category.find({
                $or: [
                    { parentCategory: categoryId },
                    { ancestors: categoryId }
                ]
            }).session(session);

            for (const child of childCategories) {
                await updateAncestors(child._id, session);
            }

            req.responseData = {
                message: 'Category updated successfully',
                category
            };
        });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, req.responseData)
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

export const deactivateCategoryController = async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { categoryId } = validatedData;

            const category = await Category.findById(categoryId).session(session);
            if (!category) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Category not found');
            }

            if (!category.isActive) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, 'Category is already inactive');
            }

            category.isActive = false;
            await category.save({ session });

            await Category.updateMany(
                {
                    $or: [
                        { parentCategory: categoryId },
                        { ancestors: categoryId }
                    ]
                },
                { isActive: false },
                { session }
            );

            req.responseData = {
                message: 'Category deactivated successfully (including child categories)'
            };
        });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, req.responseData)
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

export const activateCategoryController = async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { categoryId } = validatedData;

            const category = await Category.findById(categoryId).session(session);
            if (!category) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Category not found');
            }

            if (category.isActive) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, 'Category is already active');
            }

            if (category.parentCategory) {
                const parent = await Category.findById(category.parentCategory).session(session);
                if (!parent?.isActive) {
                    throw buildErrorObject(httpStatus.BAD_REQUEST, 'Cannot activate category with inactive parent');
                }
            }

            category.isActive = true;
            await category.save({ session });

            req.responseData = {
                message: 'Category activated successfully'
            };
        });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, req.responseData)
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

export const deleteCategoryController = async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { categoryId } = validatedData;

            const category = await Category.findById(categoryId).session(session);
            if (!category) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Category not found');
            }

            // Check if category has child categories
            const childCategories = await Category.find({
                parentCategory: categoryId
            }).session(session);

            if (childCategories.length > 0) {
                throw buildErrorObject(
                    httpStatus.BAD_REQUEST, 
                    'Cannot delete category with child categories. Please delete or move child categories first.'
                );
            }

            // Check if category is being used by products or services
            // Note: You may need to add these checks based on your product/service models
            // const productsUsingCategory = await Product.countDocuments({ category: categoryId }).session(session);
            // if (productsUsingCategory > 0) {
            //     throw buildErrorObject(httpStatus.BAD_REQUEST, 'Cannot delete category that is being used by products');
            // }

            // Delete the category
            await Category.findByIdAndDelete(categoryId).session(session);

            req.responseData = {
                message: 'Category deleted successfully'
            };
        });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, req.responseData)
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};


export const getCategoryTreeController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { includeInactive = false } = validatedData;

        const filter = includeInactive ? {} : { isActive: true };

        const categories = await Category.find(filter)
            .populate('parentCategory', 'name slug')
            .sort({ name: 1 });

        const buildTree = (categories, parentId = null) => {
            return categories
                .filter(cat => {
                    if (parentId === null) {
                        return !cat.parentCategory;
                    }
                    return cat.parentCategory?._id?.toString() === parentId.toString();
                })
                .map(cat => ({
                    _id: cat._id,
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description,
                    image: cat.image,
                    isActive: cat.isActive,
                    children: buildTree(categories, cat._id)
                }));
        };

        const tree = buildTree(categories);

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, tree));
    } catch (err) {
        handleError(res, err);
    }
};

export const getMainCategoriesController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        let { page = 1, limit = 10, search, isActive, city } = validatedData;

        limit = Math.min(Number(limit), 50);
        page = Number(page);

        const filter = {
            parentCategory: null // Only top-level categories
        };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true' || isActive === true;
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        const options = {
            page,
            limit,
            sort: { name: 1 }
        };

        const categories = await Category.paginate(filter, options);

        // Get child count for each main category
        const categoriesWithChildCount = await Promise.all(
            categories.docs.map(async (category) => {
                const childCount = await Category.countDocuments({
                    parentCategory: category._id,
                    isActive: true
                });
                
                return {
                    ...category.toObject(),
                    childCount
                };
            })
        );

        const response = {
            docs: categoriesWithChildCount,
            totalDocs: categories.totalDocs,
            limit: categories.limit,
            page: categories.page,
            totalPages: categories.totalPages,
            hasNextPage: categories.hasNextPage,
            hasPrevPage: categories.hasPrevPage,
            nextPage: categories.nextPage,
            prevPage: categories.prevPage,
            pagingCounter: categories.pagingCounter
        };

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
    } catch (err) {
        handleError(res, err);
    }
};