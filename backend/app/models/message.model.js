module.exports = mongoose => {
    const schema = mongoose.Schema(
        {
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                refPath: 'senderModel'
            },
            senderModel: {
                type: String,
                required: true,
                enum: ['admin', 'customer']
            },
            receiver: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'receiverModel'
            },
            receiverModel: {
                type: String,
                enum: ['admin', 'customer']
            },
            type: {
                type: String,
                enum: ['text', 'image', 'file', 'order'],
                default: 'text'
            },
            content: {
                type: String,
                default: ''
            },
            fileUrl: {
                type: String,
                default: null
            },
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'order',
                default: null
            },
            conversationType: {
                type: String,
                enum: ['internal', 'customer'],
                required: true
            },
            isRead: {
                type: Boolean,
                default: false
            }
        },
        { timestamps: true }
    );

    schema.method("toJSON", function () {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const Message = mongoose.model("message", schema);
    return Message;
};
