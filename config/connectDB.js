const mongoose = require("mongoose");
const keys = require("./keys");
module.exports = async function () {
    try {
        connection = await mongoose.connect(keys.mongoURI, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });
        console.log(`MongoDB Connected: ${connection.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`, error);
        process.exit(1);
    }
};
