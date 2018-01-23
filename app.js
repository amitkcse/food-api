var express = require('express')
var app = express();
var socket = require('socket.io');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
const cors = require('cors');

var Order = require('./models/orderModel');
var Item = require('./models/itemModel');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cors({
  origin: ['http://139.59.23.128:3000','http://139.59.23.128:3001','http://139.59.23.128:3002'],
  credentials: true
}));

var port =  process.env.PORT || 3051;

var db = mongoose.connect('mongodb://localhost:27017/food-order', (err, db)=> {
    if (err) {
        console.log('Unable to connect to the server. Please start the server. Error:', err);
    } else {
        console.log('Connected to Server successfully!');
    }
});

var server = app.listen(port, ()=>{
    console.log('app running on port', port, process.env.PORT);
});

var io = socket(server);

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('order-done', (doneOrder)=>{
    if(doneOrder._id){
     Order.findByIdAndUpdate(doneOrder._id, {$set:{status : 'closed'}}, {new: true}, (err, updatedOrder)=>{
       if(err){// error code} else{
         Item.findByIdAndUpdate(updatedOrder.itemId,
           { $inc: { 'createdTillNow' : updatedOrder.quantity, openOrder: -1*updatedOrder.quantity}},{new: true},(err, updatedItem)=>{
             if(err){// error code} else{
               io.emit('done-order',{updatedItem: updatedItem, updatedOrder: updatedOrder});
             }
           })
       }
     })
   }
 })
})


app.post('/place-order', (req, res)=>{
  if(req.body.item && req.body.quantity){
    console.log('place-order',req.body)
    var order = new Order({'itemId': req.body.item._id, 'itemName' : req.body.item.name ,
                                  quantity: req.body.quantity});
    order.save((err, placedOrder)=> {
          if (err) {
            console.log('Some error in placing order', err);
            res.status(400).json({error:'invalid data sent'});
          } else{
            console.log(placedOrder);
            Item.findByIdAndUpdate(placedOrder.itemId,
              { $inc: { openOrder: placedOrder.quantity}},{new: true},  (err, updatedItem)=>{
                if(err){} else{
                  io.emit('order-placed', {placedOrder: placedOrder,updatedItem: updatedItem });
                  res.status(200).json({placedOrder: placedOrder});
                }
              })
          }
        });
    }else{
    res.status(400).json({error:'invalid data sent'});
   }
 });


app.post('/view-orders', (req, res)=>{
    Order.find( {status:'open'},(err, orders )=>{
     if(err){
        res.status(500);
     } else {
       console.log('response served order');
       res.status(200).json(orders);
     }
   })
});

app.post('/add-item',(req,res)=>{
   if(req.body.name && req.body.predictedValue){
     var item = new Item({'name': req.body.name, 'predictedValue': req.body.predictedValue});
     item.save((err, savedItem)=>{
       if(err){
         res.status(400).json({error:err});
       }else{
         io.emit('item-added', savedItem);
         res.json(savedItem);
       }
     });
   } else{ res.status(400).json({error: 'kya data bhej rhe ho bhai'});}
});

app.post('/view-items', (req, res)=>{
    Item.find( (err, items )=>{
     if(err){
        res.status(500);
     } else {
       console.log('response served item');
       res.status(200).json(items);
     }
   })
});
