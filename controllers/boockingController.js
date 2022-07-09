const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)



exports.getCheckoutSession = CatchAsync( async (req, res, next) => {
// 1) get current booked tour
// ВРЕМЕННО! так как не безопасною любой может сюда попасть. 
const tour = await Tour.findById(req.params.tourId)
//2) 
const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],//можно указать несколько типов
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,//НЕ БЕЗОПАСНО в проде мы будем использовать webhook от самомго страйпа 
    cancel_url:`${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items:[{//эти поля менять нельзя! они используются страйпом
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.tours.com/image/huadi/dasidfkskdf.jpeg`], //используем живые фото в интеренете.
        amount: tour.price * 100, // потому что в центах
        currency: 'usd',
        quantity: 1
    }]
})
// 3) create session as response
res.status(200).json({
    status: 'success',
    session
})

})

exports.createBookingCheckout = CatchAsync(async (req,res,next) => {
    const {tour, user, price} = req.query
    if(!tour, !price, !user){
        return next()
    }
await Booking.create({tour, user, price})

res.redirect(req.originalUrl.split('?')[0])
})