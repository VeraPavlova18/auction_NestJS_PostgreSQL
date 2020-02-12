const socket = io('http://localhost:3001');
const tbody = document.getElementById('bidsInfo');
const lotId = 3
const BearerToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdmxvdmFAZ29vZ2xlLmNvbSIsImlhdCI6MTU4MTUwNjkwMCwiZXhwIjoxNTgxNTEwNTAwfQ.Pqlfr5J7_XD53gdhSgV-7VXw1oCCRFzuyCbI5t8nOrI';

async function getBids() {
  let resp = await fetch(`http://localhost:3000/lots/${lotId}/bids`, {    
    headers: { Authorization: BearerToken },
  });

  let bids = await resp.json();

  bids.map(bid => {
    let trBid = document.createElement('tr');
    let tdBid1 = document.createElement('td');
    let tdBid2 = document.createElement('td');
    let tdBid3 = document.createElement('td');
    tdBid3.innerHTML = bid.customer;
    tdBid2.innerHTML = bid.proposedPrice;
    tdBid1.innerHTML = moment(bid.creationTime).format('MMMM Do YYYY, h:mm:ss a');
    trBid.prepend(tdBid1);
    trBid.prepend(tdBid2);
    trBid.prepend(tdBid3);
    tbody.prepend(trBid);
  })
}

socket.on('connection', data => console.log(data));

socket.on('newBid', bid => {   
  if (bid.lotId === lotId) {
    console.log(bid.lotId , lotId)
    let trBid = document.createElement('tr');
    let tdBid1 = document.createElement('td');
    let tdBid2 = document.createElement('td');
    let tdBid3 = document.createElement('td'); 
    tdBid3.innerHTML = bid.customer;
    tdBid2.innerHTML = bid.proposedPrice;
    tdBid1.innerHTML = moment(bid.creationTime).format('MMMM Do YYYY, h:mm:ss a');
    trBid.prepend(tdBid1);
    trBid.prepend(tdBid2);
    trBid.prepend(tdBid3);
    tbody.prepend(trBid);
  } 
  
});

getBids()

