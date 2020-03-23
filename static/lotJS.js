const tbody = document.getElementById('lotInfo');
const lotId = 2;
const BearerToken =
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdmxvdmEudmVyYTE4QGdtYWlsLmNvbSIsImlhdCI6MTU4NDcxNTg1OSwiZXhwIjoxNTg1MDc1ODU5fQ.z-uszZhHEkkzIj1yzguwRxJX5u6D2fU6pSX2yg-33Ug';
const stripe = Stripe('pk_test_OpzhOpr3bug3wxs5xcfTnTyO00CTB762VF');
const elements = stripe.elements();

async function getLot() {
  let resp = await fetch(`http://localhost:3000/lots/${lotId}`, {
    headers: { Authorization: BearerToken },
  });
  let resp2 = await fetch(`http://localhost:3000/lots/${lotId}/bids`, {
    headers: { Authorization: BearerToken },
  });
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
  const style = {
    base: {
      color: "#32325d",
    }
  };
  
  var card = elements.create("card", { style });
  card.mount("#card-element");

  card.addEventListener('change', ({error}) => {
    const displayError = document.getElementById('card-errors');
    if (error) {
      displayError.textContent = error.message;
    } else {
      displayError.textContent = '';
    }
  });

  const form = document.getElementById('payment-form');
  const resp = await fetch(`http://localhost:3000/lots/${lotId}/payment`, {
    headers: { Authorization: BearerToken },
  });
  const paymentIntent = await resp.json();
  const clientSecret = paymentIntent.client_secret;

  form.addEventListener('submit', function(ev) {
    ev.preventDefault();
    stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: card,
      },
      setup_future_usage: 'off_session'
    }).then(function(result) {
      console.log(result)
      if (result.error) {
        console.log(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          console.log('Success')
        }
      }
    });
  });
}

getLot();
getPay();
