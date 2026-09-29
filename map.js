(function () {
  var miles = document.querySelector(".miles");
  if (!miles) return;

  var cards = Array.prototype.slice.call(miles.querySelectorAll(".case"));

  function clear() {
    document.body.classList.remove("has-focus");
    cards.forEach(function (card) {
      card.classList.remove("is-open");
    });
  }

  cards.forEach(function (card) {
    card.tabIndex = 0;
    card.addEventListener("click", function (event) {
      if (event.target.closest("a")) return;
      var open = card.classList.contains("is-open");
      clear();
      if (!open) {
        card.classList.add("is-open");
        document.body.classList.add("has-focus");
      }
    });
    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") clear();
  });

  document.querySelector(".sheet").addEventListener("click", function (event) {
    if (!event.target.closest(".case")) clear();
  });
})();
