const tbody = document.getElementById('lotInfo');
const lotId = 2;
const BearerToken =
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdmxvdmEudmVyYTE4QGdtYWlsLmNvbSIsImlhdCI6MTU4NDUzMzk4MywiZXhwIjoxNTg0ODkzOTgzfQ.XblPEabFXlRpTNplXMiBtR675ueHCi-vuREV9Jx7E5I';
const stripe = Stripe('pk_test_OpzhOpr3bug3wxs5xcfTnTyO00CTB762VF');
let buyButton = document.getElementById('buy-button');

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
  const resp = await fetch(`http://localhost:3000/lots/${lotId}/payment`, {
    headers: { Authorization: BearerToken },
  });
  const session = await resp.json();
  const sessionId = session.id;

  buyButton.addEventListener('click', function(event) {
    event.preventDefault();
    stripe
      .redirectToCheckout({
        sessionId,
      })
      .then(function(result) {});
  });
}

getLot();
getPay();
