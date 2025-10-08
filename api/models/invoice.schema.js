import mongoose from 'mongoose'

const LineItemSchema = new mongoose.Schema(
  {
    description: { type: String, default: '' },
    productId: { type: mongoose.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    lineTotal: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
)

const AdminInvoiceSchema = new mongoose.Schema(
  {
    quotationId: { type: mongoose.Types.ObjectId, ref: 'Quotation' },
    chatId: { type: mongoose.Types.ObjectId, ref: 'Chat' },
    sellerId: { type: mongoose.Types.ObjectId, ref: 'Seller' },
    buyer: { type: mongoose.Types.ObjectId, ref: 'Buyer' },

    seller: {
      id: { type: mongoose.Types.ObjectId, ref: 'Seller' },
      businessName: { type: String },
      email: { type: String },
      phone: { type: String },
      website: { type: String, default: null },
      taxId: { type: String, default: null },
      address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        country: { type: String, default: '' },
      },
    },

    buyerInfo: {
      id: { type: mongoose.Types.ObjectId, ref: 'Buyer' },
      name: { type: String },
      email: { type: String, default: null },
      phone: { type: String, default: null },
      address: {
        city: { type: String, default: '' },
        state: { type: String, default: '' },
      },
    },

    invoiceNumber: { type: String, index: true },
    invoiceDate: { type: Date },
    dueDate: { type: Date },
    currency: { type: String, default: 'CAD' },
    poNumber: { type: String, default: null },

    items: { type: [LineItemSchema], default: [] },
    negotiatedPrice: { type: Number, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    shippingCharges: { type: Number, default: 0, min: 0 },
    additionalFees: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },

    paymentTerms: { type: String, default: null },
    deliveryTerms: { type: String, default: null },
    acceptedPaymentMethods: { type: [String], default: [] },
    notes: { type: String, default: null },

    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired'], default: 'pending' },
    acceptedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    viewedByBuyer: { type: Boolean, default: false },
    viewedAt: { type: Date, default: null },
    expiresAt: { type: Date },
    createdAt: { type: Date },
  },
  {
    collection: 'Invoice',
    versionKey: false,
  }
)

export default mongoose.model('AdminInvoice', AdminInvoiceSchema)


