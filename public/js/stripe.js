import axios from 'axios'
import { showAlert } from './alerts'
import Stripe from 'stripe'



const stripe = Stripe('MYAPIKEY')

export const bookTour =async  tourid => {
try {

    // 1) get session from server API
    const session = await axios(`http:/127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`) 
    //2) create checkout form + charge credit card
await stripe.redirectToCheckout({
    sessionId:session.data.session.id
})

}catch(err){
    console.log(err);
    showAlert('error', err)
}
    

}