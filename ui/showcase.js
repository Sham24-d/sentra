const revealItems = document.querySelectorAll(".reveal");
const metricValues = document.querySelectorAll(".metric-value");
const liveMetrics = document.querySelectorAll(".live-metric");
const heroStatus = document.querySelector("#heroStatus");
const heroPeople = document.querySelector("#heroPeople");
const heroThreat = document.querySelector("#heroThreat");
const overlayTop = document.querySelector("#overlayTop");
const overlayBottom = document.querySelector("#overlayBottom");
const alertList = document.querySelector("#alertList");

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.18 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const animateMetric = (element) => {
    const target = Number(element.dataset.target || 0);
    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(target * eased);

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };

    requestAnimationFrame(step);
};

const metricObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateMetric(entry.target);
                metricObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.5 }
);

metricValues.forEach((metric) => metricObserver.observe(metric));

const renderAlerts = (alerts) => {
    if (!alertList) {
        return;
    }

    if (!alerts.length) {
        alertList.innerHTML = "<li><span>No active alerts</span><strong>Stable</strong></li>";
        return;
    }

    alertList.innerHTML = alerts
        .map(
            (alert) =>
                `<li><span>${alert.message}</span><strong>${alert.time}</strong></li>`
        )
        .join("");
};

const applyStatus = (status) => {
    liveMetrics.forEach((metric) => {
        const key = metric.dataset.key;
        metric.textContent = String(status[key] ?? 0);
    });

    if (heroStatus) {
        heroStatus.textContent = status.system_status || "Monitoring";
    }

    if (heroPeople) {
        heroPeople.textContent = `People ${status.people ?? 0}`;
    }

    if (heroThreat) {
        const activeThreat = status.weapons > 0
            ? "Weapon detected"
            : status.throwing
                ? "Throwing alert"
                : status.trespass > 0
                    ? "Restricted breach"
                    : "No threat";
        heroThreat.textContent = activeThreat;
    }

    if (overlayTop) {
        overlayTop.textContent = `Suspicious subjects ${status.suspicious ?? 0}`;
    }

    if (overlayBottom) {
        overlayBottom.textContent = `Updated ${status.updated_at || "--:--:--"} | Zone breaches ${status.trespass ?? 0}`;
    }

    renderAlerts(status.recent_alerts || []);
};

const refreshStatus = async () => {
    try {
        const response = await fetch("/api/status", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const status = await response.json();
        applyStatus(status);
    } catch (error) {
        if (heroStatus) {
            heroStatus.textContent = "Live link reconnecting";
        }
    }
};

refreshStatus();
window.setInterval(refreshStatus, 1000);
