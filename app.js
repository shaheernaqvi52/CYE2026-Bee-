const form = document.getElementById("setup-form");
const setupScreen=document.getElementById("setup-screen");
const dashboard=document.getElementById("dashboard");
const resetBtn=document.getElementById("reset-btn");
const expenseForm=document.getElementById("expense-form");
let expenses=JSON.parse(localStorage.getItem("expenses")) || [];

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
    if ((settings.allowance-spent)>=0){
        document.getElementById("show-left").classList.remove("over");
        document.getElementById("show-left").textContent=settings.allowance-spent;
    }
    else{
        document.getElementById("show-left").classList.add("over");
        document.getElementById("show-left").textContent="Over by PKR "+Math.abs(settings.allowance-spent);
    }
    renderPrediction(spent,settings.allowance-spent,settings);
}

function renderPrediction(spent,left,settings){
        const box=document.getElementById("prediction");

        if (spent===0){
            box.textContent="Add an expense to see your prediction.";
            return;
        }
        if (left===0){
            box.textContent="You've used up your allowance for this allowance cycle.";
            return;
        }
        if(left<0){
            box.textContent="You've gone PKR "+Math.abs(left) + " over your allowance this cycle.";
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
        } else{
            const runOut=new Date(today);
            runOut.setDate(today.getDate()+daysItLasts);
            const dateText=runOut.toLocaleDateString("en-GB",{day:"numeric",month:"long"});
            box.textContent="At this pace you'll run out on " +dateText+", "+(daysToPayday-daysItLasts)+" days before your next allowance. "+"Spend under PKR "+safeDaily+" per day to make it last.";
        
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