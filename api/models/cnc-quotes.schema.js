import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const CNCQuote = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    contact: {
        type: String,
        required: true,
        trim: true
    },

    city: {
        type: String,
        required: true,
        trim: true
    },
    
    workType: {
        type: String,
        required: true,
        trim: true
    },

    budget: {
        type: String,
        trim: true
    },

    timeline: {
        type: String,
        trim: true
    },
    
    description: {
        type: String,
        trim: true
    }
}, 
{
    collection: 'CNCQuotae',
    timestamps: true
})

CNCQuote.plugin(paginate)
CNCQuote.plugin(aggregatePaginate)

export default mongoose.model('CNCQuote', CNCQuote)