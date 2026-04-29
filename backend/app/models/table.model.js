module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        tableNumber: {
            type: Number,
            required: true,
            unique: true,
        },
        
        qrCode: { type: String, unique: true }, // Save trữ URL hoặc dữ liệu của mã QR
        isAvailable: { type: Boolean, default: true },
        status: { type: String, enum: ['Empty', 'Reserved', 'In Use', 'Completed'], default: 'Empty' },
        seatingCapacity: { 
            type: Number, 
            required: true,
            min: 1 
        },
        location: { 
            type: String,
            enum: ['1st Floor Indoor', '2nd Floor Indoor', '1st Floor Outdoor', '2nd Floor Outdoor'],
            required: true 
        },
        merged_into: {
            type: String,
            default: null
        },
        session_pin: {
            type: String,
            default: null
        },
        session_start: {
            type: Date,
            default: null
        }
      }
    );
  
    const Table = mongoose.model('table', schema);
  
    return Table;
  };