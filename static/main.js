const socket = io('http://localhost:3001');
const tbody = document.getElementById('bidsInfo');
const lotId = 3
const BearerToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdmxvdmEudmVyYTE4QGdtYWlsLmNvbSIsImlhdCI6MTU4NDUzMzk4MywiZXhwIjoxNTg0ODkzOTgzfQ.XblPEabFXlRpTNplXMiBtR675ueHCi-vuREV9Jx7E5I';

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
    tdBid1.innerHTML = bid.setCustomer;
    tdBid2.innerHTML = bid.proposedPrice;
    tdBid3.innerHTML = moment(bid.creationTime).format('MMMM Do YYYY, h:mm:ss a');
    trBid.append(tdBid1);
    trBid.append(tdBid2);
    trBid.append(tdBid3);
    tbody.append(trBid);
  })
}

socket.on('connection', data => console.log(data));

socket.on('newBid', bid => {   
  if (bid.lotId === lotId) {
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

