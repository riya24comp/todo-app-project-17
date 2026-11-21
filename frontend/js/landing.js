/* =====================================
   TASKFLOW — LANDING INTERACTIONS
===================================== */

const previewDate = document.getElementById("previewDate");
if (previewDate) previewDate.textContent = formatLongDate(new Date());

const previewTasks = document.getElementById("previewTasks");

function updatePreviewProgress() {
    if (!previewTasks) return;

    const tasks = [...previewTasks.querySelectorAll(".preview-task")];
    const done = tasks.filter(task => task.classList.contains("is-done")).length;
    const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

    const ring = document.getElementById("previewRing");
    const percentLabel = document.getElementById("previewPercent");
    const bar = document.getElementById("previewBar");
    const foot = document.getElementById("previewFootText");

    if (ring) ring.style.setProperty("--value", String(percent));
    if (percentLabel) percentLabel.textContent = `${percent}%`;
    if (bar) bar.style.width = `${percent}%`;
    if (foot) foot.textContent = `${done} of ${tasks.length} tasks complete`;
}

previewTasks?.addEventListener("click", event => {
    const button = event.target.closest(".preview-check");
    if (!button) return;

    const task = button.closest(".preview-task");
    if (!task) return;

    const isDone = task.classList.toggle("is-done");
    const label = task.querySelector(".preview-status");

    button.setAttribute("aria-pressed", String(isDone));
    button.setAttribute("aria-label", isDone ? "Mark task as pending" : "Mark task as complete");

    if (label) {
        label.textContent = isDone ? "Done" : "Pending";
        label.className = `pill preview-status ${isDone ? "pill-success" : "pill-warning"}`;
    }

    updatePreviewProgress();
});

updatePreviewProgress();
