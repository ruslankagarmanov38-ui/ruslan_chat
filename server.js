const express=require('express');
const app=express();
const http=require('http').createServer(app);
const io=require('socket.io')(http,{cors:{origin:"*"}});
app.use(express.static('public'));

let queue=[], online=0;

io.on('connection',socket=>{
 online++;
 io.emit('online_count',online);

 socket.on('join_queue',data=>{
  queue.push({socket,data});
  if(queue.length>=2){
    const a=queue.shift();
    const b=queue.shift();
    const room="room_"+Math.random();
    a.socket.join(room);
    b.socket.join(room);
    a.socket.emit("matched",{roomId:room});
    b.socket.emit("matched",{roomId:room});
  }
 });

 socket.on('leave_queue',()=> queue=queue.filter(x=>x.socket!==socket));

 socket.on('typing',({roomId})=>{
  socket.to(roomId).emit("partner_typing");
 });

 socket.on('message',({roomId,text})=>{
  io.to(roomId).emit("message",{text,from:socket.id});
 });

 socket.on('end',({roomId})=>{
  io.to(roomId).emit("ended");
 });

 socket.on('disconnect',()=>{
  online--;
  io.emit('online_count',online);
  queue=queue.filter(x=>x.socket!==socket);
 });
});

const PORT=process.env.PORT||8080;
http.listen(PORT,()=>console.log("Server on port",PORT));
