document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  if (window.lucide) window.lucide.createIcons();

  const toastRegion = $("#toastRegion");
  function toast(message, icon = "check-circle-2") {
    const item = document.createElement("div");
    item.className = "toast";
    const iconEl = document.createElement("i");
    iconEl.setAttribute("data-lucide", icon);
    const text = document.createElement("span");
    text.textContent = message;
    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss message");
    close.innerHTML = '<i data-lucide="x"></i>';
    close.addEventListener("click", () => item.remove());
    item.append(iconEl, text, close);
    toastRegion.append(item);
    if (window.lucide) window.lucide.createIcons({ nodes: [item] });
    window.setTimeout(() => item.remove(), 3800);
  }

  // Search filters subjects and activity items as the user types.
  const searchInput = $("#globalSearch");
  const subjectCards = $$(".subject-card");
  console.log("Search input:", searchInput);
  console.log("Subject cards found:", subjectCards.length);
  const activityItems = $$(".activity-item");
  function runSearch() {
    const term = searchInput.value.trim().toLowerCase();
    let visibleSubjects = 0;
    subjectCards.forEach(card => {
      const match = !term || card.textContent.toLowerCase().includes(term);
      card.hidden = !match;
      if (match) visibleSubjects++;
    });
    $("#emptySearch").hidden = visibleSubjects !== 0;
    activityItems.forEach(item => {
      item.hidden = !!term && !item.textContent.toLowerCase().includes(term) && !(item.dataset.searchable || "").includes(term);
    });
  }
  searchInput.addEventListener("input", runSearch);
  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape") {
      searchInput.blur();
      $("#sidebar").classList.remove("open");
    }
  });

  // Subject details dialog.
  const dialog = $("#detailDialog");
  subjectCards.forEach(card => card.addEventListener("click", () => {
    const title = card.dataset.subject;
    const description = card.dataset.description;
    const progress = Number(card.dataset.progress || 0);
    $("#dialogTitle").textContent = title;
    renderMaterials(title);
    $("#dialogDescription").textContent = description;
    $("#dialogProgress").textContent = `${progress}%`;
    $("#dialogProgressBar").style.width = `${progress}%`;
    $(".dialog-icon", dialog).style.background = getComputedStyle(card).backgroundColor || "#e6f5eb";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else toast(`${title}: ${description}`, "book-open");
  }));
  $("#dialogClose").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  
$("#dialogAction").addEventListener("click", () => {
  const title = $("#dialogTitle").textContent;
  renderMaterials(title);
  toast(`Open the course materials for ${title}.`, "book-open");
});

  $("#viewAllSubjects").addEventListener("click", () => {
    searchInput.value = "";
    runSearch();
    toast("Showing all six subjects.", "book-open");
  });
  
  // Store materials separately for each subject.
  const materialsBySubject = {};

  function renderMaterials(subject) {
    const materialList = $("#materialList");
    materialList.innerHTML = "";

    const files = materialsBySubject[subject] || [];

    if (files.length === 0) {
      const message = document.createElement("li");
      message.textContent = "No materials uploaded yet.";
      materialList.appendChild(message);
      return;
    }

    files.forEach(file => {
      const item = document.createElement("li");
      const link = document.createElement("a");

      link.href = file.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "📄 " + file.name;

      item.appendChild(link);
      materialList.appendChild(item);
    });
  }

  const materialUpload = $("#materialUpload");

  materialUpload.addEventListener("change", () => {
    const subject = $("#dialogTitle").textContent;

    if (!subject || !materialUpload.files.length) return;

    materialsBySubject[subject] ||= [];

    [...materialUpload.files].forEach(file => {
      materialsBySubject[subject].push({
        name: file.name,
        url: URL.createObjectURL(file)
         
      });
    });

    renderMaterials(subject);
    materialUpload.value = "";
    toast("Course materials uploaded successfully.", "file-check");
  });


  // Sidebar navigation highlights the active section and guides the user.
  $$(".nav-item").forEach(button => button.addEventListener("click", () => {
    $$(".nav-item").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    const page = button.dataset.page;
    $("#sidebar").classList.remove("open");
    const targetMap = {
      "Dashboard": ".welcome-banner",
      "My Courses": "#subjectsSection",
      "Messages": ".activity-panel",
      "Friends": ".online-panel",
      "Schedule": "#calendarSection",
      "To-Do List": "#todoSection",
      "Settings": ".profile-card"
    };
    const target = $(targetMap[page]);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (page !== "Dashboard" && page !== "My Courses" && page !== "Schedule" && page !== "To-Do List") {
      toast(`${page} section selected. This dashboard demo can be connected to your college portal.`, "info");
    }
  }));
  $("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  document.addEventListener("click", event => {
    if (window.innerWidth <= 700 && $("#sidebar").classList.contains("open") &&
        !$("#sidebar").contains(event.target) && !$("#menuToggle").contains(event.target)) {
      $("#sidebar").classList.remove("open");
    }
  });

  // To-do checkboxes update the completed count; new tasks can be added.
  const todoList = $(".todo-list");
  function updateTodoCounter() {
    const all = $$(".todo-item", todoList);
    const completed = all.filter(item => $("input", item).checked).length;
    $("#todoCounter").textContent = `${completed}/${all.length} done`;
    all.forEach(item => item.classList.toggle("completed", $("input", item).checked));
  }
  todoList.addEventListener("change", updateTodoCounter);
  $("#addTaskForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = $("#newTask");
    const value = input.value.trim();
    if (!value) {
      input.focus();
      toast("Please enter a task first.", "alert-circle");
      return;
    }
    const label = document.createElement("label");
    label.className = "todo-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const check = document.createElement("span");
    check.className = "custom-check";
    check.innerHTML = '<i data-lucide="check"></i>';
    const copy = document.createElement("span");
    copy.className = "todo-copy";
    const title = document.createElement("strong");
    title.textContent = value;
    const date = document.createElement("small");
    date.textContent = "Added just now";
    copy.append(title, date);
    label.append(checkbox, check, copy);
    todoList.append(label);
    input.value = "";
    updateTodoCounter();
    if (window.lucide) window.lucide.createIcons({ nodes: [label] });
    toast("Task added to your list.", "check-circle-2");
  });
  updateTodoCounter();

  // Calendar supports previous/next month and selecting a date.
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  let displayedMonth = new Date(2026, 9, 1);
  let selectedDate = "2026-10-14";
  const taskDates = new Set(["2026-10-15", "2026-10-16", "2026-10-18"]);
  function dateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function renderCalendar() {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    $("#calendarMonth").textContent = `${monthNames[month]} ${year}`;
    const grid = $("#calendarGrid");
    grid.innerHTML = "";
    ["Su","Mo","Tu","We","Th","Fr","Sa"].forEach(day => {
      const el = document.createElement("span");
      el.className = "calendar-weekday";
      el.textContent = day;
      grid.append(el);
    });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousDays = new Date(year, month, 0).getDate();
    for (let i = 0; i < 42; i++) {
      let day, date, muted = false;
      if (i < firstDay) {
        day = previousDays - firstDay + i + 1;
        date = new Date(year, month - 1, day);
        muted = true;
      } else if (i >= firstDay + daysInMonth) {
        day = i - firstDay - daysInMonth + 1;
        date = new Date(year, month + 1, day);
        muted = true;
      } else {
        day = i - firstDay + 1;
        date = new Date(year, month, day);
      }
      const key = dateKey(date.getFullYear(), date.getMonth(), date.getDate());
      const button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-day";
      button.textContent = day;
      button.setAttribute("aria-label", `${monthNames[date.getMonth()]} ${day}, ${date.getFullYear()}`);
      if (muted) button.classList.add("muted");
      if (key === selectedDate) {
        button.classList.add("selected");
        button.setAttribute("aria-pressed", "true");
      } else {
        button.setAttribute("aria-pressed", "false");
      }
      if (taskDates.has(key)) button.classList.add("has-task");
      button.addEventListener("click", () => {
        selectedDate = key;
        if (muted) displayedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        renderCalendar();
        toast(`Selected ${monthNames[date.getMonth()]} ${day}, ${date.getFullYear()}.`, "calendar-days");
      });
      grid.append(button);
    }
  }
  $("#prevMonth").addEventListener("click", () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  $("#nextMonth").addEventListener("click", () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  $("#todayButton").addEventListener("click", () => {
    displayedMonth = new Date(2026, 9, 1);
    selectedDate = "2026-10-14";
    renderCalendar();
    toast("Returned to the dashboard's demo date: October 14, 2026.", "calendar-check");
  });
  renderCalendar();

  // Demo actions give feedback rather than leaving controls inert.
  $("#notificationButton").addEventListener("click", () => toast("You have 3 unread notifications: 1 quiz reminder and 2 messages.", "bell"));
  $("#settingsButton").addEventListener("click", () => toast("Settings panel selected. Personal preferences can be added here.", "settings"));
  $("#profileButton").addEventListener("click", () => toast("Signed in as Shahana .A — profile preview.", "user-round"));
  $("#viewProfile").addEventListener("click", () => toast("Profile preview: BTech Computer Science, 2nd Year.", "user-round"));
  $("#activityViewAll").addEventListener("click", () => toast("You're viewing the latest four activities.", "activity"));
  $$(".user-chip").forEach(button => button.addEventListener("click", () => toast(`${button.dataset.name} is online. Messaging can be connected here.`, "message-circle")));
  $("#moreUsers").addEventListener("click", () => toast("7 more classmates are online.", "users"));
  $$("[data-quicklink]").forEach(button => button.addEventListener("click", () => toast(`${button.dataset.quicklink} selected. Add your course links here.`, "external-link")));
});
