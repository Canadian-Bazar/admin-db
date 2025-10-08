import httpStatus from 'http-status'
import { matchedData } from 'express-validator'
import AdminInvoice from '../models/invoice.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'

export const getInvoicesController = async (req, res) => {
  try {
    const validated = matchedData(req)
    let { page = 1, limit = 10, status } = validated
    page = Number(page)
    limit = Math.min(Number(limit), 100)

    const filter = {}
    if (status) filter.status = status

    const query = AdminInvoice.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const [invoices, total] = await Promise.all([
      query.exec(),
      AdminInvoice.countDocuments(filter),
    ])

    return res
      .status(httpStatus.OK)
      .json(
        buildResponse(httpStatus.OK, {
          invoices,
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        })
      )
  } catch (err) {
    handleError(res, err)
  }
}

export const getInvoiceByIdController = async (req, res) => {
  try {
    const { invoiceId } = matchedData(req)
    const invoice = await AdminInvoice.findById(invoiceId)
    if (!invoice) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(buildResponse(httpStatus.NOT_FOUND, 'Invoice not found'))
    }
    return res
      .status(httpStatus.OK)
      .json(buildResponse(httpStatus.OK, { invoice }))
  } catch (err) {
    handleError(res, err)
  }
}


