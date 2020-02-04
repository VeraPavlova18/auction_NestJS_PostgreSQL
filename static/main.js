const socket = io('http://localhost:3001')

  socket.on('connection', data => console.log(data));

  socket.on('newBid', bid => {
    let tbody = document.getElementById('bidsInfo');        
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
  });