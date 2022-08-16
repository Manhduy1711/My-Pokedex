var arrayNavItem = document.querySelectorAll(".nav-link");
console.log(arrayNavItem[0]);
arrayNavItem.forEach(element => {
    element.addEventListener("click", function() {
        var current = document.getElementsByClassName("active");
        current[0].className = current[0].className.replace(" active", "");
        element.classList.add("active");
    })
})