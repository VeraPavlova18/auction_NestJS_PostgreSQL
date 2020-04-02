const tbody = document.getElementById('lotInfo');
const lotId = 2;
const BearerToken =
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdmxvdmEudmVyYTE4QGdtYWlsLmNvbSIsImlhdCI6MTU4NTEzMjk4NiwiZXhwIjozNjAwMDAwMDAwMTU4NTEzMDAwMH0.OK7rPvEpiQO9zf-LOjciIDHj9wPuVTNsMy7ky9B5nP0';

async function getLot() {
  let resp = await fetch(`http://localhost:3000/lots/${lotId}`, { headers: { Authorization: BearerToken } });
  let resp2 = await fetch(`http://localhost:3000/lots/${lotId}/bids`, { headers: { Authorization: BearerToken } });
  let bids = await resp2.json();
  let lot = await resp.json();
  bids.sort((a, b) => (a.proposedPrice < b.proposedPrice ? 1 : -1));
  let tr = document.createElement('tr');
  let td1 = document.createElement('td');
  let td2 = document.createElement('td');
  let td3 = document.createElement('td');
  td1.innerHTML = lot.title;
  td2.innerHTML = lot.description;
  td3.innerHTML = bids[0].proposedPrice;
  tr.append(td1);
  tr.append(td2);
  tr.append(td3);
  tbody.append(tr);
}

async function getPay() { 
  const stripe = Stripe('pk_test_OpzhOpr3bug3wxs5xcfTnTyO00CTB762VF');
  const elements = stripe.elements();  
  const card = elements.create("card"); 
  card.mount("#card-element");

  card.addEventListener('change', ({ error }) => {
    const displayError = document.getElementById('card-errors');
    if (error) { 
      displayError.textContent = error.message;
    } else { displayError.textContent = ''; }
  });  
  
  const form = document.getElementById('payment-form');
  const resp = await fetch(`http://localhost:3000/lots/${lotId}/payment`, { headers: { Authorization: BearerToken } });
  const paymentIntent = await resp.json();

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();      

    const confirmPayment = await stripe.confirmCardPayment(paymentIntent.client_secret, { payment_method: { card } });

    if (confirmPayment.error) {
      console.log(confirmPayment.error.message);
      await fetch(`http://localhost:3000/lots/${lotId}/payment/cancel`, { headers: { Authorization: BearerToken } });
    } else {
      if (confirmPayment.paymentIntent.status === 'succeeded') {
        console.log('Success')  
        await fetch(`http://localhost:3000/lots/${lotId}/payment/success?cp=${confirmPayment.paymentIntent.id}`, { headers: { Authorization: BearerToken } });
      }
    }    
  });
}

getLot();
getPay();
