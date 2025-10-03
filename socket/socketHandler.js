const Message = require('../models/Message');
const Status = require('../models/Status');

const activeConnections = new Map();
const supervisorConnections = new Map();

module.exports = function(io){
  console.log('⚡ WebSocket ready');

  io.on('connection', (socket) => {
    console.log('🔌 socket connected:', socket.id);

    socket.on('agent_connect', ({agentCode}) => {
      if (!agentCode) return socket.emit('connection_error',{message:'Agent code required'});
      const code = agentCode.toUpperCase();
      activeConnections.set(code, socket.id);
      socket.agentCode = code; socket.userType = 'agent';
      socket.broadcast.emit('agent_connected',{agentCode: code, timestamp:new Date()});
      socket.emit('connection_success',{agentCode: code, status:'connected'});
    });

    socket.on('supervisor_connect', ({supervisorCode}) => {
      if (!supervisorCode) return socket.emit('connection_error',{message:'Supervisor code required'});
      const code = supervisorCode.toUpperCase();
      supervisorConnections.set(code, socket.id);
      socket.supervisorCode = code; socket.userType = 'supervisor';
      socket.emit('connection_success',{supervisorCode: code, status:'connected'});
    });

    socket.on('update_status', async ({agentCode, status}) => {
      try{
        if(!agentCode || !status) return socket.emit('status_error',{message:'agentCode and status required'});
        const doc = await Status.create({ agentCode: agentCode.toUpperCase(), status, timestamp:new Date() });
        socket.broadcast.emit('agent_status_update',{ agentCode: doc.agentCode, status: doc.status, timestamp: doc.timestamp });
        socket.emit('status_updated',{ agentCode: doc.agentCode, status: doc.status, timestamp: doc.timestamp });
      }catch(e){
        console.error(e); socket.emit('status_error',{message:'Failed to update status'});
      }
    });

    socket.on('send_message', async ({fromCode, toCode, toTeamId, content, type='direct'}) => {
      try{
        const data = { fromCode: fromCode.toUpperCase(), content, type, timestamp:new Date(), isRead:false };
        if (type==='direct' && toCode) data.toCode = toCode.toUpperCase();
        if (type==='broadcast' && toTeamId) data.toTeamId = parseInt(toTeamId);
        const msg = await Message.create(data);
        if (msg.toCode){
          const sid = activeConnections.get(msg.toCode);
          if (sid) io.to(sid).emit('new_message',{ messageId: msg._id, fromCode: msg.fromCode, content: msg.content, timestamp: msg.timestamp, type:'direct' });
        } else {
          socket.broadcast.emit('new_message',{ messageId: msg._id, fromCode: msg.fromCode, content: msg.content, timestamp: msg.timestamp, type:'broadcast', toTeamId: msg.toTeamId });
        }
        socket.emit('message_sent',{ messageId: msg._id, status:'delivered' });
      }catch(e){
        console.error(e); socket.emit('message_error',{message:'Failed to send message'});
      }
    });

    socket.on('disconnect', ()=>{
      if (socket.agentCode){
        activeConnections.delete(socket.agentCode);
        socket.broadcast.emit('agent_disconnected',{ agentCode: socket.agentCode, timestamp:new Date() });
      }
      if (socket.supervisorCode){
        supervisorConnections.delete(socket.supervisorCode);
      }
      console.log('🔌 socket disconnected:', socket.id);
    });
  });
};
