module.exports=async function(req,res){
    try{
        const text=String((req.body && req.body.text)||"").slice(0,200);
        const response=await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method:"POST",
            headers:{
                "content-type":"application/json",
                "authorization":"Bearer "+process.env.GROQ_API_KEY
            },
            body:JSON.stringify({
                model:"llama-3.3-70b-versatile",
                max_tokens:100,
                temperature:0,
                messages:[{
                    role:"user",
                    content:
                    'A student said this about an expense: "' + text + '". ' +
                    'The speech recognizer may have misheard local food or place names, so use context to guess what was meant. ' +
                    'Reply with only JSON like {"amount": 350, "category": "Food", "note": "lunch"}. ' +
                    'category must be exactly Food, Transport or Other. ' +
                    'amount is a number in rupees (convert spoken numbers like "three fifty" to 350), or null if none was said. ' +
                    'note is a short description of 1-4 words, without the amount.'
                }]
            })
        });

        const data=await response.json();
        res.status(200).json({result: data.choices[0].message.content});
    }   catch(e){
        res.status(500).json({error:"failed"});
    }
};