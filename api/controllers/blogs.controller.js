import { matchedData } from 'express-validator'
import Blog from '../models/blogs.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import httpStatus from 'http-status'
import buildErrorObject from '../utils/buildErrorObject.js'
import { uploadFile } from '../helpers/aws-s3.js'

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

export const createBlogController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { title, author, content, description, coverImageAlt } = validatedData;

        let coverImage = "";

        if (req.files?.length) {
            const [uploadedUrl] = await uploadFile(req.files);
            console.log(uploadedUrl);
            coverImage = uploadedUrl;
        }

        // Accept optional slug from client or generate from title
        const requestedSlug = (validatedData.slug || '').toString().trim();
        let baseSlug = requestedSlug || generateSlug(title);
        let slug = baseSlug || 'blog';
        let suffix = 1;
        while (await Blog.exists({ slug })) {
            slug = `${baseSlug}-${suffix++}`;
        }

        const newBlog = await Blog.create({
            title,
            author,
            content,
            description,
            coverImage,
            coverImageAlt,
            slug,
        });

        return res.status(httpStatus.CREATED).json(
            buildResponse(httpStatus.CREATED, {
                message: "Blog created successfully",
                blog: newBlog,
            })
        );
    } catch (err) {
        handleError(res, err);
    }
};

export const getAllBlogsController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        let { page = 1, limit = 10, search } = validatedData;

        limit = Math.min(Number(limit), 50);
        page = Number(page);

        const filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [blogs, totalDocs] = await Promise.all([
            Blog.find(filter)
                .select('-content')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Blog.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalDocs / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        const result = {
            docs: blogs,
            totalDocs,
            limit,
            page,
            totalPages,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
        };

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, result));
    } catch (err) {
        handleError(res, err);
    }
};

export const getBlogByIdController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { blogId } = validatedData;

        const blog = await Blog.findById(blogId);

        if (!blog) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Blog not found');
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, blog));
    } catch (err) {
        handleError(res, err);
    }
};

export const updateBlogController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { blogId, title, author, content, description, coverImageAlt } = validatedData;

        const blog = await Blog.findById(blogId);
        if (!blog) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Blog not found');
        }

        if (title && title !== blog.title) {
            let slug = generateSlug(title);
            let count = 0;
            let existingBlog;
            
            do {
                if (count > 0) {
                    slug = `${generateSlug(title)}-${count}`;
                }
                existingBlog = await Blog.findOne({ 
                    slug, 
                    _id: { $ne: blogId } 
                });
                count++;
            } while (existingBlog);

            blog.slug = slug;
            blog.title = title;
        }

        if (author !== undefined) {
            blog.author = author;
        }

        if (content !== undefined) {
            blog.content = content;
        }

        if (description !== undefined) {
            blog.description = description;
        }

        if (coverImageAlt !== undefined) {
            blog.coverImageAlt = coverImageAlt;
        }

        if (req.files && req.files.length > 0) {
            const imageUrls = await uploadFile(req.files);
            console.log(imageUrls);
            blog.coverImage = imageUrls[0];
        }

        await blog.save();

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, 
              'Blog updated successfully'
            )
        );

    } catch (err) {
        handleError(res, err);
    }
};

export const deleteBlogController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { blogId } = validatedData;

        const blog = await Blog.findById(blogId);
        if (!blog) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Blog not found');
        }

        await Blog.findByIdAndDelete(blogId);

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Blog deleted successfully'
            })
        );

    } catch (err) {
        handleError(res, err);
    }
};