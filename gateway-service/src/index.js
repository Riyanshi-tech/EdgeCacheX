const express = require('express');
const app = express();
app.use(express.json());
app.get("/",(req,res)=>{
    res.send("Gateway Service");
});
app.listen(5000,()=>{
    console.log("Gateway Service is running on port 5000");
});