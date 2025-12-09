const mongoose = require('mongoose')

const connectDB = async () => {
	try {
		const uri = process.env.MONGODB_URI
		if (!uri) {
			throw new Error('MONGODB_URI is not set in environment variables')
		}
		await mongoose.connect(uri)
		console.log('Database Connected Successfully.')
	} catch (error) {
		console.log(error.message)
	}
}

module.exports = connectDB