class AppError extends  Error
{
    constructor(message,statusCode)
    {
        super(message)
        this.statusCode= statusCode;
        this.status =`${statusCode}`.startsWith(4) ? 'fail' : 'error'
        this.isOperational = true; // for invalid route or invalid request payload, we will get this error
        
        Error.captureStackTrace(this,this.constructor)
    }
}

module.exports = AppError