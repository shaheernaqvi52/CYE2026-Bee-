const form = document.getElementById("setup-form");
const setupScreen=document.getElementById("setup-screen");
const dashboard=document.getElementById("dashboard");
const resetBtn=document.getElementById("reset-btn");
const expenseForm=document.getElementById("expense-form");
const demoBtn=document.getElementById("demo-btn");
const micBtn = document.getElementById("mic-btn");
const voiceStatus=document.getElementById("voice-status");
const SpeechRecognition=window.SpeechRecognition || window.webkitSpeechRecognition;
const langSelect=document.getElementById("voice-lang");
let expenses=JSON.parse(localStorage.getItem("expenses")) || [];

demoBtn.addEventListener("click",function(){
    const tenDaysAgo=new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate()-10);
    const payday=Math.min(tenDaysAgo.getDate(),28);

    const settings={allowance:15000, payday: payday};
    expenses=[
        {amount:3500,category:"Food",note:"Groceries"},
        {amount:2250,category:"Transport",note:"Bus ticket home"},
        {amount:2000,category:"Other",note:"Registration fee for an event"},
        {amount:1250,category:"Food",note:"Food from restaurant"}
    ];

    localStorage.setItem("settings",JSON.stringify(settings));
    localStorage.setItem("expenses",JSON.stringify(expenses));
    showDashboard(settings);
});

function normalizeUrduDigits(str){
    const urduDigits="۰۱۲۳۴۵۶۷۸۹";
    return str.replace(/[۰-۹]/g, function (d){
        return String(urduDigits.indexOf(d));
    });
}


function parseExpense(text){
    const normalized=normalizeUrduDigits(text);
    const lower=text.toLowerCase().replace(/,/g,"");
    const match=lower.match(/\d+/);
    const amount=match ? Number(match[0]):null;
    const keywords={
        Food:["lunch", "dinner", "breakfast", "brunch", "supper", "meal", "food",
            "snack", "snacks", "canteen", "cafe", "cafeteria", "dhaba", "restaurant",
            "takeaway", "delivery", "foodpanda", "groceries", "grocery", "ration",

            // Pakistani / Desi dishes & street food
            "biryani", "pulao", "karahi", "handi", "nihari", "haleem", "paya",
            "korma", "qorma", "daal", "dal", "sabzi", "bhindi", "aloo", "palak",
            "paneer", "tikka", "boti", "kabab", "kebab", "seekh", "chapli",
            "sajji", "chargha", "broast", "shawarma", "roll", "paratha roll",
            "paratha", "anda paratha", "halwa puri", "puri", "chanay", "chana",
            "naan", "roti", "kulcha", "samosa", "pakora", "chaat", "dahi bhalla",
            "gol gappay", "pani puri", "bun kabab", "anday wala burger",

            // Fast food & baked goods
            "pizza", "burger", "zinger", "fries", "nuggets", "wings", "sandwich",
            "wrap", "pasta", "macaroni", "noodles", "chow mein", "soup", "momos",
            "dumplings", "steak", "taco", "loaded fries", "sub", "patty", "patties",
            "bakery", "cake", "pastry", "donut", "doughnut", "brownie", "cookie",
            "biscuit", "biscuits", "chips", "nimko", "chocolate", "mithai", "jalebi",
            "gulab jamun", "rasmalai", "kheer", "ice cream", "kulfi", "falooda",

            // Drinks & dairy
            "chai", "tea", "doodh patti", "karak", "coffee", "latte", "cappuccino",
            "espresso", "cold coffee", "juice", "shake", "milkshake", "smoothie",
            "lassi", "limca", "soda", "coke", "pepsi", "sprite", "7up", "water",
            "mineral water", "milk", "doodh", "yogurt", "dahi", "eggs", "anday", "bread",

            //urdu
            "کھانا", "بریانی", "کڑاہی", "چائے", "ناشتہ", "روٹی", "نان", "سموسہ", "پراٹھا", "شوارما", "پیزا", "برگر"
        ],
        
        Transport:[// Ride-hailing & delivery riders
            "uber", "indrive", "indriver", "yango", "careem", "bykea", "ride",
            "cab", "taxi", "captain", "driver", "fare", "kiraya",

            // Local & public transit
            "rickshaw", "auto", "chingchi", "qinqi", "bus", "metro", "metro bus",
            "speedo", "orange line", "orange train", "train", "daewoo", "faisal movers",
            "van", "wagon", "hiace", "coaster", "shuttle", "university bus", "point",
            "ticket", "pass", "metro card", "top up", "topup", "commute", "travel",

            // Personal vehicle, fuel & maintenance
            "fuel", "petrol", "diesel", "cng", "gas", "tank", "refuel", "pump",
            "pso", "shell", "total", "attock", "hascol", "bike", "motorbike",
            "motorcycle", "car", "gaari", "parking", "toll", "motorway", "challan",
            "puncture", "tyre", "tire", "oil change", "tuning", "mechanic", "service",

            //urdu
            "رکشہ", "بس", "میٹرو", "ٹیکسی", "پیٹرول", "بائیک", "کرایہ", "سفر"
        ]
    };

    let category="Other";
    for (const cat in keywords){
        const found=keywords[cat].some(function(word){
            return lower.includes(word);
        });
        if (found){
            category=cat;
        }
    }
    
    const note = normalized
        .replace(/\d+/, "")
        .replace(/\b(rupees|rs|pkr)\b/gi, "")
        .replace(/روپے/g, "")
        .replace(/[.,!?۔]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    return{amount:amount, category:category,note:note};
}

async function smartParse(text){
    try{
        const r=await fetch("/api/categorize",{
            method:"POST",
            headers:{"content-type":"application/json"},
            body:JSON.stringify({text:text})
        });
        const data=await r.json();

        const jsonText=data.result.match(/\{[\s\S]*\}/)[0];
        const parsed=JSON.parse(jsonText);

        const okCategory=["Food","Transport","Other"].includes(parsed.category);
        const okAmount=parsed.amount===null || typeof parsed.amount==="number";
        if (!okCategory || !okAmount){
            throw new Error("bad answer");
        }
        return parsed;
    }  catch (e){
        return parseExpense(text);
    }
}


function setPill(text,type){
    const pill=document.getElementById("status-pill");
    pill.textContent=text;
    pill.className="pill "+type;
} 

function showDashboard(settings){
    document.getElementById("show-allowance").textContent=settings.allowance;
    document.getElementById("show-payday").textContent=settings.payday;
    setupScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");
    renderExpenses();
}

function renderExpenses(){
    const list=document.getElementById("expense-list");
    list.innerHTML="";

    let spent=0;
    expenses.forEach(function (exp,index){
        spent=spent+exp.amount;

        const li=document.createElement("li");
        li.textContent=exp.category+": PKR "+exp.amount+" " +exp.note;
        const deleteEntry=document.createElement("button");
        deleteEntry.textContent="X";
        deleteEntry.addEventListener("click",function(event){
            expenses.splice(index,1);
            localStorage.setItem("expenses",JSON.stringify(expenses));
            renderExpenses();
        });
        list.appendChild(li);
        li.appendChild(deleteEntry);
    });

    const settings=JSON.parse(localStorage.getItem("settings"));
    document.getElementById("show-spent").textContent=spent;
    const left=settings.allowance-spent;
    const leftEl=document.getElementById("show-left");

    if(left>=0){
        leftEl.classList.remove("over");
        leftEl.textContent="PKR "+left;
        document.getElementById("progress-fill").style.background="var(--peach)"
    }else{
        leftEl.classList.add("over");
        leftEl.textContent="Over by PKR "+Math.abs(left);
        document.getElementById("progress-fill").style.background="var(--danger)"
    }
    const percent=Math.min((spent/settings.allowance)*100,100);
    document.getElementById("progress-fill").style.width=percent+"%"

    renderPrediction(spent,left,settings);
}

function renderPrediction(spent,left,settings){
        const box=document.getElementById("prediction");

        if (spent === 0) {
    box.innerHTML = `
        <div class="prediction-empty">
            <img src="images/budgie-peeking.png"
                 alt="Budgie peeking"
                 class="prediction-mascot">

            <div>
                <strong>No expenses yet!</strong>
                <p>Add your first expense and I'll help you
                keep track of your allowance.</p>
            </div>
        </div>
    `;

    setPill("Just getting started", "good");
    return;
}
        }
        if (left===0){
            box.innerHTML = "<strong>You've used up your allowance</strong> for this allowance cycle.";
            setPill("Allowance used up","bad");
            return;
        }
        if(left<0){
            box.innerHTML = `You've gone <strong>PKR ${Math.abs(left)}</strong> over your allowance this cycle.`;
            setPill("Over Budget","bad")
            return;
        }

        const today=new Date();
        today.setHours(0,0,0,0);

        let start=new Date(today.getFullYear(),today.getMonth(),settings.payday);
        if (start>today){
            start=new Date(today.getFullYear(),today.getMonth()-1,settings.payday);
        }
        const nextPayday=new Date(start.getFullYear(),start.getMonth()+1,settings.payday);
        
        const msPerDay=1000*60*60*24;
        const daysPassed=Math.round((today-start)/msPerDay)+1;
        const daysToPayday=Math.round((nextPayday-today)/msPerDay);

        const dailyRate=spent/daysPassed;
        const daysItLasts=Math.floor(left/dailyRate);
        const safeDaily=Math.floor(left/daysToPayday);

        if (daysItLasts>=daysToPayday){
            box.textContent="You're on Track! Your money will last until your next allowance. You can spend: PKR "+safeDaily+ " each day.";
            setPill("On track","good");
        } else{
            const runOut=new Date(today);
            runOut.setDate(today.getDate()+daysItLasts);
            const dateText=runOut.toLocaleDateString("en-GB",{day:"numeric",month:"long"});
            box.textContent="At this pace you'll run out on " +dateText+", "+(daysToPayday-daysItLasts)+" days before your next allowance. "+"Spend under PKR "+safeDaily+" per day to make it last.";
            setPill("Running low","warn");
        
        }

expenseForm.addEventListener("submit",function(event){
    event.preventDefault();

    const expense={
        amount: Number(document.getElementById("exp-amount").value),
        category: document.getElementById("exp-category").value,
        note: document.getElementById("exp-note").value
    };

    expenses.push(expense);
    localStorage.setItem("expenses",JSON.stringify(expenses));
    expenseForm.reset();
    renderExpenses();
});

form.addEventListener("submit",function (event){
    event.preventDefault();

    const allowance = Number(document.getElementById("allowance").value);
    const payday=Number(document.getElementById("payday").value);

    const settings={allowance: allowance, payday: payday};
    localStorage.setItem("settings",JSON.stringify(settings));
    showDashboard(settings);
});

const saved=localStorage.getItem("settings");
if (saved){
    showDashboard(JSON.parse(saved));
}

resetBtn.addEventListener("click",function(){
    localStorage.removeItem("expenses");
    localStorage.removeItem("settings");
    location.reload();
});

if(!SpeechRecognition){
    micBtn.classList.add("hidden");
    if(langSelect) langSelect.classList.add("hidden");
}else{
    const recognition = new SpeechRecognition();

    micBtn.addEventListener("click",function(){
        recognition.lang=langSelect ? langSelect.value :"en-PK";
        voiceStatus.textContent= recognition.land==="ur-PK" ? "سن رہا ہوں..." : "Listening...";
        recognition.start();
    });

    recognition.addEventListener("result",async function(event){
        const transcript=event.results[0][0].transcript;
        voiceStatus.textContent='Heard: "'+transcript+'". Working it out...';
        const parsed=await smartParse(transcript);
        if (parsed.amount !==null){
            document.getElementById("exp-amount").value=parsed.amount;
        }
        document.getElementById("exp-category").value=parsed.category;
        document.getElementById("exp-note").value=parsed.note;
        voiceStatus.textContent='Heard: "'+transcript+'". Check the fields and press Add.';
    });
    recognition.addEventListener("error",function(){
        voiceStatus.textContent="Couldn't hear that. Try again or type it.";
    });
}