const form = document.getElementById("setup-form");
const setupScreen=document.getElementById("setup-screen");
const dashboard=document.getElementById("dashboard");
const resetBtn=document.getElementById("reset-btn");
const expenseForm=document.getElementById("expense-form");
const demoBtn=document.getElementById("demo-btn");
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

        if (spent===0){
            box.textContent="Add an expense to see your prediction.";
            setPill("Just getting started","good");
            return;
        }
        if (left===0){
            box.textContent="You've used up your allowance for this allowance cycle.";
            setPill("Allowance used up","bad");
            return;
        }
        if(left<0){
            box.textContent="You've gone PKR "+Math.abs(left) + " over your allowance this cycle.";
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