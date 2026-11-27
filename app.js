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
    renderExpenses()
}

function renderExpenses(){
    const list=document.getElementById("expense-list");
    list.innerHTML="";

    let spent=0;
    expenses.forEach(function (exp,index){
        spent=spent+exp.amount;

        const li=document.createElement("li");
        li.textContent=exp.category+": PKR"+exp.amount+" " +exp.note;
        const deleteEntry=document.createElement("button");
        deleteEntry.textContent="X"
        deleteEntry.addEventListener("click",function(event){
            expenses.splice(index,1);
            localStorage.setItem("expenses",JSON.stringify(expenses));
            renderExpenses();
        })
        list.appendChild(li);
        li.appendChild(deleteEntry);
    });

    const settings=JSON.parse(localStorage.getItem("settings"));
    document.getElementById("show-spent").textContent=spent;
    document.getElementById("show-left").textContent=settings.allowance-spent;
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