# -*- coding: utf-8 -*-
{
    'name': 'CRM Lead Dashboard | Sales Pipeline Dashboard | CRM Analytics for Community & Enterprise',
    'version': '19.0.1.2.0',
    'category': 'Sales/CRM',
    'summary': 'Advanced CRM dashboard with KPIs, charts, pivot table, custom filters, and layout presets.',
    'description': """
CRM Lead Dashboard
==================

CRM Lead Dashboard adds a modern analytics screen inside the Odoo CRM app.

Main Features
-------------
* CRM application opens directly on the dashboard.
* KPI cards for leads, opportunities, expected revenue, won revenue, conversion rate, and overdue opportunities.
* Previous-period comparison percentage for leads, opportunities, expected revenue, and won revenue.
* Date range filters with presets: Today, Yesterday, This Week, Last Week, This Month, Last Month, This Quarter, Last Quarter, This Year, Last Year, and Custom Range.
* Rolling date range filters: Last 7 Days, Last 30 Days, and Last 365 Days.
* Lead and opportunity creation trend chart.
* Opportunity stage funnel chart based on expected revenue.
* Won, lost, and pending opportunity distribution chart.
* Formula KPI panel for weighted forecast, average deal size, win/loss ratio, and pipeline-to-won ratio.
* Embedded CRM pivot table grouped by stage with lead count, opportunity count, expected revenue, weighted revenue, won, lost, and conversion rate.
* Custom analysis chart with selectable group by, measure, and chart type.
* Top lead sources chart.
* Sales team performance chart.
* Salesperson performance chart.
* Campaign performance chart.
* Lost reason analysis panel.
* Recent CRM records table.
* Clickable KPI cards to open the matching CRM records.
* Clickable recent lead rows to open the related CRM form.
* Drag and drop dashboard panels to reorder the workspace.
* Resize each panel into small, wide, or full-width mode.
* Rename every dashboard panel title from the screen.
* Layout presets: Default Layout, Executive, Pipeline Review, Lead Generation, Team Performance, and Custom Layout.
* Browser-saved layout, panel size, panel order, selected layout preset, and custom panel titles.
* Reset button to restore the default panel order, size, and title.
* Responsive layout for desktop and smaller screens.
* Company-aware data using the active Odoo company.
* Works on Odoo Community.
    """,
    'author': 'Steven Marp',
    'website': 'https://apps.odoo.com/apps/modules/browse?author=Steven Marp',
    'license': 'OPL-1',
    'depends': ['crm'],
    'data': [
        'views/dashboard_action.xml',
    ],
    'images': [
        'static/description/banner.gif',
        'static/description/crm_lead_dashboard_overview.png',
    ],
    'icon': 'static/description/icon.png',
    'assets': {
        'web.assets_backend': [
            'sm_crm_lead_dashboard/static/src/scss/dashboard.scss',
            'sm_crm_lead_dashboard/static/src/xml/dashboard.xml',
            'sm_crm_lead_dashboard/static/src/js/dashboard.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'price': 250.00,
    'currency': 'USD',
}
