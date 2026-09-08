/** @odoo-module **/

import { Component, onMounted, onWillStart, onWillUnmount, useRef, useState } from "@odoo/owl";
import { loadBundle } from "@web/core/assets";
import { browser } from "@web/core/browser/browser";
import { registry } from "@web/core/registry";
import { rpc } from "@web/core/network/rpc";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";
import { useService } from "@web/core/utils/hooks";

const STORAGE_KEY = "sm_crm_lead_dashboard_layout_v1";
const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#7c3aed", "#0891b2", "#be123c", "#4b5563", "#ea580c", "#0f766e"];
const LAYOUT_OPTIONS = [
    ["default", "Default Layout"],
    ["executive", "Executive"],
    ["pipeline", "Pipeline Review"],
    ["lead_generation", "Lead Generation"],
    ["team", "Team Performance"],
    ["custom", "Custom Layout"],
];
const PERIOD_OPTIONS = [
    ["today", "Today"],
    ["yesterday", "Yesterday"],
    ["last_7_days", "Last 7 Days"],
    ["last_30_days", "Last 30 Days"],
    ["last_365_days", "Last 365 Days"],
    ["this_week", "This Week"],
    ["last_week", "Last Week"],
    ["this_month", "This Month"],
    ["last_month", "Last Month"],
    ["this_quarter", "This Quarter"],
    ["last_quarter", "Last Quarter"],
    ["this_year", "This Year"],
    ["last_year", "Last Year"],
    ["custom", "Custom Range"],
];
const CUSTOM_GROUPBY_OPTIONS = [
    ["stage_id", "Stage"],
    ["team_id", "Sales Team"],
    ["user_id", "Salesperson"],
    ["source_id", "Source"],
    ["campaign_id", "Campaign"],
    ["lost_reason_id", "Lost Reason"],
    ["type", "Type"],
    ["won_status", "Won/Lost"],
];
const CUSTOM_MEASURE_OPTIONS = [
    ["count", "Count"],
    ["expected_revenue", "Expected Revenue"],
    ["prorated_revenue", "Weighted Revenue"],
    ["probability", "Average Probability"],
];
const CUSTOM_CHART_OPTIONS = [
    ["bar", "Bar"],
    ["doughnut", "Doughnut"],
    ["line", "Line"],
];
const PANELS = ["trend", "stage", "status", "formulas", "pivot", "custom", "sources", "teams", "salespeople", "campaigns", "lost", "recent"];
const TITLES = {
    trend: "Lead and Opportunity Trend",
    stage: "Pipeline by Stage",
    status: "Won Lost Status",
    formulas: "Formula KPIs",
    pivot: "CRM Pivot Table",
    custom: "Custom Analysis",
    sources: "Lead Sources",
    teams: "Sales Teams",
    salespeople: "Salespeople",
    campaigns: "Campaigns",
    lost: "Lost Reasons",
    recent: "Recent CRM Records",
};
const DEFAULT_LAYOUT = {
    trend: { cols: 8, rows: 2 },
    stage: { cols: 4, rows: 2 },
    status: { cols: 4, rows: 2 },
    formulas: { cols: 8, rows: 2 },
    pivot: { cols: 12, rows: 2 },
    custom: { cols: 4, rows: 2 },
    sources: { cols: 4, rows: 2 },
    teams: { cols: 4, rows: 2 },
    salespeople: { cols: 4, rows: 2 },
    campaigns: { cols: 4, rows: 2 },
    lost: { cols: 4, rows: 2 },
    recent: { cols: 12, rows: 2 },
};
const LAYOUT_PRESETS = {
    default: {
        order: [...PANELS],
        layout: DEFAULT_LAYOUT,
    },
    executive: {
        order: ["trend", "formulas", "stage", "status", "recent", "pivot", "teams", "salespeople", "sources", "campaigns", "custom", "lost"],
        layout: {
            trend: { cols: 8, rows: 2 },
            formulas: { cols: 4, rows: 2 },
            stage: { cols: 4, rows: 2 },
            status: { cols: 4, rows: 2 },
            recent: { cols: 8, rows: 2 },
            pivot: { cols: 12, rows: 2 },
            teams: { cols: 4, rows: 2 },
            salespeople: { cols: 4, rows: 2 },
            sources: { cols: 4, rows: 2 },
            campaigns: { cols: 4, rows: 2 },
            custom: { cols: 4, rows: 2 },
            lost: { cols: 12, rows: 1 },
        },
    },
    pipeline: {
        order: ["stage", "pivot", "formulas", "trend", "status", "recent", "salespeople", "teams", "custom", "lost", "sources", "campaigns"],
        layout: {
            stage: { cols: 8, rows: 2 },
            pivot: { cols: 12, rows: 2 },
            formulas: { cols: 4, rows: 2 },
            trend: { cols: 4, rows: 2 },
            status: { cols: 4, rows: 2 },
            recent: { cols: 8, rows: 2 },
            salespeople: { cols: 4, rows: 2 },
            teams: { cols: 4, rows: 2 },
            custom: { cols: 4, rows: 2 },
            lost: { cols: 4, rows: 2 },
            sources: { cols: 4, rows: 2 },
            campaigns: { cols: 12, rows: 1 },
        },
    },
    lead_generation: {
        order: ["sources", "campaigns", "custom", "trend", "recent", "stage", "status", "formulas", "pivot", "teams", "salespeople", "lost"],
        layout: {
            sources: { cols: 6, rows: 2 },
            campaigns: { cols: 6, rows: 2 },
            custom: { cols: 4, rows: 2 },
            trend: { cols: 8, rows: 2 },
            recent: { cols: 4, rows: 2 },
            stage: { cols: 4, rows: 2 },
            status: { cols: 4, rows: 2 },
            formulas: { cols: 8, rows: 2 },
            pivot: { cols: 12, rows: 2 },
            teams: { cols: 4, rows: 2 },
            salespeople: { cols: 4, rows: 2 },
            lost: { cols: 8, rows: 1 },
        },
    },
    team: {
        order: ["teams", "salespeople", "custom", "stage", "trend", "status", "recent", "pivot", "formulas", "sources", "campaigns", "lost"],
        layout: {
            teams: { cols: 6, rows: 2 },
            salespeople: { cols: 6, rows: 2 },
            custom: { cols: 4, rows: 2 },
            stage: { cols: 6, rows: 2 },
            trend: { cols: 6, rows: 2 },
            status: { cols: 4, rows: 2 },
            recent: { cols: 8, rows: 2 },
            pivot: { cols: 12, rows: 2 },
            formulas: { cols: 8, rows: 2 },
            sources: { cols: 4, rows: 2 },
            campaigns: { cols: 4, rows: 2 },
            lost: { cols: 4, rows: 2 },
        },
    },
};

export class CRMLeadDashboard extends Component {
    static template = "sm_crm_lead_dashboard.Dashboard";
    static props = { ...standardActionServiceProps };

    setup() {
        this.action = useService("action");
        const saved = this.loadLayout();
        const dates = this.periodDates("this_month");
        this.state = useState({
            data: null,
            loading: true,
            period: "this_month",
            dateFrom: dates.dateFrom,
            dateTo: dates.dateTo,
            order: saved.order,
            layout: saved.layout,
            layoutPreset: saved.layoutPreset,
            titles: saved.titles,
            editingTitle: null,
            customGroupby: saved.customGroupby,
            customMeasure: saved.customMeasure,
            customChartType: saved.customChartType,
            openDropdown: null,
        });
        this.charts = [];
        this.draggedPanel = null;
        this.onDocumentClick = this.onDocumentClick.bind(this);

        this.trendCanvas = useRef("trendCanvas");
        this.stageCanvas = useRef("stageCanvas");
        this.statusCanvas = useRef("statusCanvas");
        this.sourcesCanvas = useRef("sourcesCanvas");
        this.teamsCanvas = useRef("teamsCanvas");
        this.salespeopleCanvas = useRef("salespeopleCanvas");
        this.campaignsCanvas = useRef("campaignsCanvas");
        this.customCanvas = useRef("customCanvas");

        onWillStart(async () => loadBundle("web.chartjs_lib"));
        onMounted(() => {
            document.addEventListener("click", this.onDocumentClick);
            this.refresh();
        });
        onWillUnmount(() => {
            document.removeEventListener("click", this.onDocumentClick);
            this.destroyCharts();
        });
    }

    loadLayout() {
        try {
            const parsed = JSON.parse(browser.localStorage.getItem(STORAGE_KEY) || "{}");
            const order = (parsed.order || []).filter((panel) => PANELS.includes(panel));
            for (const panel of PANELS) {
                if (!order.includes(panel)) {
                    order.push(panel);
                }
            }
            const layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
            const titles = { ...TITLES };
            const layoutPreset = parsed.layoutPreset && LAYOUT_PRESETS[parsed.layoutPreset] ? parsed.layoutPreset : (parsed.layout ? "custom" : "default");
            const customGroupby = parsed.customGroupby || "stage_id";
            const customMeasure = parsed.customMeasure || "expected_revenue";
            const customChartType = parsed.customChartType || "bar";
            for (const panel of PANELS) {
                if (parsed.layout && parsed.layout[panel]) {
                    layout[panel] = {
                        cols: Math.max(2, Math.min(12, parsed.layout[panel].cols || DEFAULT_LAYOUT[panel].cols)),
                        rows: Math.max(1, Math.min(5, parsed.layout[panel].rows || DEFAULT_LAYOUT[panel].rows)),
                    };
                }
                if (parsed.titles && typeof parsed.titles[panel] === "string" && parsed.titles[panel].trim()) {
                    titles[panel] = parsed.titles[panel].trim().slice(0, 60);
                }
            }
            return { order: order.length ? order : [...PANELS], layout, layoutPreset, titles, customGroupby, customMeasure, customChartType };
        } catch {
            return { order: [...PANELS], layout: JSON.parse(JSON.stringify(DEFAULT_LAYOUT)), layoutPreset: "default", titles: { ...TITLES }, customGroupby: "stage_id", customMeasure: "expected_revenue", customChartType: "bar" };
        }
    }

    saveLayout() {
        browser.localStorage.setItem(STORAGE_KEY, JSON.stringify({
            order: this.state.order,
            layout: this.state.layout,
            layoutPreset: this.state.layoutPreset,
            titles: this.state.titles,
            customGroupby: this.state.customGroupby,
            customMeasure: this.state.customMeasure,
            customChartType: this.state.customChartType,
        }));
    }

    resetLayout() {
        this.state.order = [...PANELS];
        this.state.layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
        this.state.layoutPreset = "default";
        this.state.titles = { ...TITLES };
        this.state.editingTitle = null;
        this.state.customGroupby = "stage_id";
        this.state.customMeasure = "expected_revenue";
        this.state.customChartType = "bar";
        browser.localStorage.removeItem(STORAGE_KEY);
        this.renderChartsSoon();
    }

    toggleDropdown(name) {
        this.state.openDropdown = this.state.openDropdown === name ? null : name;
    }

    onDocumentClick(ev) {
        if (!ev.target.closest(".sm_crm_dropdown")) {
            this.state.openDropdown = null;
        }
    }

    layoutOptions() {
        return LAYOUT_OPTIONS;
    }

    periodOptions() {
        return PERIOD_OPTIONS;
    }

    customGroupbyOptions() {
        return CUSTOM_GROUPBY_OPTIONS;
    }

    customMeasureOptions() {
        return CUSTOM_MEASURE_OPTIONS;
    }

    customChartOptions() {
        return CUSTOM_CHART_OPTIONS;
    }

    layoutLabel() {
        return Object.fromEntries(LAYOUT_OPTIONS)[this.state.layoutPreset] || "Custom Layout";
    }

    periodLabel() {
        return Object.fromEntries(PERIOD_OPTIONS)[this.state.period] || "Custom Range";
    }

    customGroupbyLabel() {
        return Object.fromEntries(CUSTOM_GROUPBY_OPTIONS)[this.state.customGroupby] || "Stage";
    }

    customMeasureLabel() {
        return Object.fromEntries(CUSTOM_MEASURE_OPTIONS)[this.state.customMeasure] || "Expected Revenue";
    }

    customChartLabel() {
        return Object.fromEntries(CUSTOM_CHART_OPTIONS)[this.state.customChartType] || "Bar";
    }

    selectLayoutPreset(preset) {
        this.state.openDropdown = null;
        if (preset === "custom") {
            this.state.layoutPreset = "custom";
            this.saveLayout();
            return;
        }
        this.applyLayoutPreset(preset);
    }

    selectPeriod(period) {
        this.state.openDropdown = null;
        this.state.period = period;
        if (period !== "custom") {
            const dates = this.periodDates(period);
            this.state.dateFrom = dates.dateFrom;
            this.state.dateTo = dates.dateTo;
            this.refresh();
        }
    }

    selectCustomGroupby(value) {
        this.state.openDropdown = null;
        this.state.customGroupby = value;
        this.saveLayout();
        this.refresh();
    }

    selectCustomMeasure(value) {
        this.state.openDropdown = null;
        this.state.customMeasure = value;
        this.saveLayout();
        this.refresh();
    }

    selectCustomChartType(value) {
        this.state.openDropdown = null;
        this.state.customChartType = value;
        this.saveLayout();
        this.renderChartsSoon();
    }

    onLayoutPresetChange(ev) {
        this.selectLayoutPreset(ev.target.value);
    }

    applyLayoutPreset(name) {
        const preset = LAYOUT_PRESETS[name] || LAYOUT_PRESETS.default;
        this.state.order = [...preset.order];
        this.state.layout = JSON.parse(JSON.stringify(preset.layout));
        this.state.layoutPreset = name;
        this.state.editingTitle = null;
        this.saveLayout();
        this.renderChartsSoon();
    }

    async refresh() {
        this.state.loading = true;
        this.destroyCharts();
        this.state.data = await rpc("/sm_crm_lead_dashboard/data", {
            date_from: this.state.dateFrom,
            date_to: this.state.dateTo,
            custom_groupby: this.state.customGroupby,
            custom_measure: this.state.customMeasure,
        });
        this.state.loading = false;
        this.renderChartsSoon();
    }

    renderChartsSoon() {
        browser.setTimeout(() => this.renderCharts(), 80);
    }

    renderCharts() {
        if (!this.state.data || !window.Chart) {
            return;
        }
        this.destroyCharts();
        this.chart(this.trendCanvas.el, "line", {
            labels: this.state.data.trend.map((item) => item.date),
            datasets: [
                { label: "Leads", data: this.state.data.trend.map((item) => item.leads), borderColor: COLORS[0], backgroundColor: "rgba(37, 99, 235, .12)", fill: true, tension: 0.35 },
                { label: "Opportunities", data: this.state.data.trend.map((item) => item.opportunities), borderColor: COLORS[1], backgroundColor: "rgba(22, 163, 74, .12)", fill: true, tension: 0.35 },
            ],
        });
        this.chart(this.stageCanvas.el, "bar", this.barDataset(this.state.data.stage_funnel, "expected_revenue", "Expected Revenue"), { indexAxis: "y" });
        this.chart(this.statusCanvas.el, "doughnut", this.simpleDataset(this.state.data.status_counts));
        this.chart(this.sourcesCanvas.el, "bar", this.barDataset(this.state.data.sources, "count", "Leads"), { indexAxis: "y" });
        this.chart(this.teamsCanvas.el, "bar", this.barDataset(this.state.data.teams, "expected_revenue", "Expected Revenue"), { indexAxis: "y" });
        this.chart(this.salespeopleCanvas.el, "bar", this.barDataset(this.state.data.salespeople, "expected_revenue", "Expected Revenue"), { indexAxis: "y" });
        this.chart(this.campaignsCanvas.el, "doughnut", this.arrayDataset(this.state.data.campaigns, "name", "count"));
        const customOptions = this.state.customChartType === "bar" ? { indexAxis: "y" } : {};
        this.chart(this.customCanvas.el, this.state.customChartType, this.arrayDataset(this.state.data.custom_chart, "name", "value"), customOptions);
    }

    chart(canvas, type, data, options = {}) {
        if (!canvas) {
            return;
        }
        this.charts.push(new window.Chart(canvas, {
            type,
            data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                ...options,
            },
        }));
    }

    simpleDataset(mapping) {
        return {
            labels: Object.keys(mapping),
            datasets: [{ data: Object.values(mapping), backgroundColor: COLORS }],
        };
    }

    arrayDataset(items, labelKey, valueKey) {
        return {
            labels: items.map((item) => item[labelKey]),
            datasets: [{ data: items.map((item) => item[valueKey]), backgroundColor: COLORS }],
        };
    }

    barDataset(items, valueKey, label) {
        return {
            labels: items.map((item) => item.name),
            datasets: [{ label, data: items.map((item) => item[valueKey]), backgroundColor: COLORS[0] }],
        };
    }

    destroyCharts() {
        for (const chart of this.charts) {
            chart.destroy();
        }
        this.charts = [];
    }

    onPeriodChange(ev) {
        this.selectPeriod(ev.target.value);
    }

    onDateFromChange(ev) {
        this.state.period = "custom";
        this.state.dateFrom = ev.target.value;
        this.refresh();
    }

    onDateToChange(ev) {
        this.state.period = "custom";
        this.state.dateTo = ev.target.value;
        this.refresh();
    }

    onCustomGroupbyChange(ev) {
        this.selectCustomGroupby(ev.target.value);
    }

    onCustomMeasureChange(ev) {
        this.selectCustomMeasure(ev.target.value);
    }

    onCustomChartTypeChange(ev) {
        this.selectCustomChartType(ev.target.value);
    }

    periodDates(period) {
        const today = new Date();
        const date = (value) => {
            const month = `${value.getMonth() + 1}`.padStart(2, "0");
            const day = `${value.getDate()}`.padStart(2, "0");
            return `${value.getFullYear()}-${month}-${day}`;
        };
        const startOfWeek = (value) => {
            const copy = new Date(value);
            const day = copy.getDay() || 7;
            copy.setDate(copy.getDate() - day + 1);
            return copy;
        };
        const startOfQuarter = (value) => new Date(value.getFullYear(), Math.floor(value.getMonth() / 3) * 3, 1);
        let start = new Date(today.getFullYear(), today.getMonth(), 1);
        let end = today;
        if (period === "today") {
            start = today;
        } else if (period === "yesterday") {
            start = new Date(today);
            start.setDate(start.getDate() - 1);
            end = start;
        } else if (period === "last_7_days") {
            start = new Date(today);
            start.setDate(start.getDate() - 6);
        } else if (period === "last_30_days") {
            start = new Date(today);
            start.setDate(start.getDate() - 29);
        } else if (period === "last_365_days") {
            start = new Date(today);
            start.setDate(start.getDate() - 364);
        } else if (period === "this_week") {
            start = startOfWeek(today);
        } else if (period === "last_week") {
            end = startOfWeek(today);
            end.setDate(end.getDate() - 1);
            start = new Date(end);
            start.setDate(start.getDate() - 6);
        } else if (period === "last_month") {
            start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            end = new Date(today.getFullYear(), today.getMonth(), 0);
        } else if (period === "this_quarter") {
            start = startOfQuarter(today);
        } else if (period === "last_quarter") {
            end = startOfQuarter(today);
            end.setDate(end.getDate() - 1);
            start = startOfQuarter(end);
        } else if (period === "this_year") {
            start = new Date(today.getFullYear(), 0, 1);
        } else if (period === "last_year") {
            start = new Date(today.getFullYear() - 1, 0, 1);
            end = new Date(today.getFullYear() - 1, 11, 31);
        }
        return { dateFrom: date(start), dateTo: date(end) };
    }

    onDragStart(ev, panel) {
        this.draggedPanel = panel;
        ev.dataTransfer.effectAllowed = "move";
    }

    onDrop(ev, target) {
        ev.preventDefault();
        if (!this.draggedPanel || this.draggedPanel === target) {
            return;
        }
        const order = [...this.state.order];
        const from = order.indexOf(this.draggedPanel);
        const to = order.indexOf(target);
        order.splice(from, 1);
        order.splice(to, 0, this.draggedPanel);
        this.state.order = order;
        this.state.layoutPreset = "custom";
        this.draggedPanel = null;
        this.saveLayout();
        this.renderChartsSoon();
    }

    resize(panel, cols, rows) {
        this.state.layout[panel] = { cols, rows };
        this.state.layoutPreset = "custom";
        this.saveLayout();
        this.renderChartsSoon();
    }

    title(panel) {
        return this.state.titles[panel] || TITLES[panel];
    }

    startTitleEdit(panel) {
        this.state.editingTitle = panel;
    }

    onTitleInput(panel, ev) {
        this.state.titles[panel] = ev.target.value.slice(0, 60);
    }

    saveTitle(panel) {
        const value = (this.state.titles[panel] || "").trim();
        this.state.titles[panel] = value || TITLES[panel];
        this.state.editingTitle = null;
        this.saveLayout();
    }

    onTitleKeydown(panel, ev) {
        if (ev.key === "Enter") {
            this.saveTitle(panel);
        } else if (ev.key === "Escape") {
            this.state.titles[panel] = TITLES[panel];
            this.state.editingTitle = null;
            this.saveLayout();
        }
    }

    formatCurrency(value) {
        const kpis = this.state.data.kpis;
        const amount = Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
        return kpis.currency_position === "after" ? `${amount} ${kpis.currency_symbol}` : `${kpis.currency_symbol} ${amount}`;
    }

    trendClass(value) {
        return value >= 0 ? "text-success" : "text-danger";
    }

    trendIcon(value) {
        return value >= 0 ? "fa-arrow-up" : "fa-arrow-down";
    }

    abs(value) {
        return Math.abs(value || 0);
    }

    dateDomain() {
        return [
            ["create_date", ">=", `${this.state.dateFrom} 00:00:00`],
            ["create_date", "<=", `${this.state.dateTo} 23:59:59`],
        ];
    }

    openLeadDomain(domain, context = {}) {
        this.action.doAction({
            type: "ir.actions.act_window",
            name: "CRM Records",
            res_model: "crm.lead",
            views: [[false, "list"], [false, "kanban"], [false, "form"], [false, "pivot"], [false, "graph"]],
            domain: [...this.dateDomain(), ...domain],
            context: { active_test: false, ...context },
            target: "current",
        });
    }

    openLeads() {
        this.openLeadDomain([["type", "=", "lead"]], { default_type: "lead" });
    }

    openOpportunities() {
        this.openLeadDomain([["type", "=", "opportunity"]], { default_type: "opportunity" });
    }

    openWon() {
        this.openLeadDomain([["type", "=", "opportunity"], ["won_status", "=", "won"]], { default_type: "opportunity" });
    }

    openOverdue() {
        const today = new Date().toISOString().slice(0, 10);
        this.action.doAction({
            type: "ir.actions.act_window",
            name: "Overdue Opportunities",
            res_model: "crm.lead",
            views: [[false, "list"], [false, "kanban"], [false, "form"], [false, "pivot"], [false, "graph"]],
            domain: [["type", "=", "opportunity"], ["active", "=", true], ["won_status", "=", "pending"], ["date_deadline", "<", today]],
            context: { default_type: "opportunity" },
            target: "current",
        });
    }

    openRecord(recordId) {
        this.action.doAction({
            type: "ir.actions.act_window",
            res_model: "crm.lead",
            res_id: recordId,
            views: [[false, "form"]],
            context: { active_test: false },
            target: "current",
        });
    }
}

registry.category("actions").add("sm_crm_lead_dashboard", CRMLeadDashboard);
