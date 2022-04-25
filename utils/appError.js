class AppError extends Error {
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode
        //status code сначала переделываем в строку и потом применяем к ней startsWith - это встроенная функция(метод)
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true //вводим эту проверку чтобы не отправлять пользователям ошибки которые не используют этот конструктор. 


        Error.captureStackTrace(this, this.constructor) //короче это поможет нам отслеживать место где появилась ошибка. Но нихера не понятно
    }
}

module.exports = AppError