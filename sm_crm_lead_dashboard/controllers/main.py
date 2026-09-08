# -*- coding: utf-8 -*-

from collections import defaultdict
from datetime import datetime, timedelta

from odoo import fields, http
from odoo.http import request


class CRMLeadDashboard(http.Controller):

    @http.route('/sm_crm_lead_dashboard/data', type='jsonrpc', auth='user')
    def dashboard_data(self, date_from=None, date_to=None, custom_groupby='stage_id', custom_measure='expected_revenue', **kwargs):
        company = request.env.company
        date_from = fields.Date.from_string(date_from) if date_from else fields.Date.today().replace(day=1)
        date_to = fields.Date.from_string(date_to) if date_to else fields.Date.today()
        if date_to < date_from:
            date_from, date_to = date_to, date_from

        period_days = (date_to - date_from).days + 1
        prev_from = date_from - timedelta(days=period_days)
        prev_to = date_from - timedelta(days=1)

        Lead = request.env['crm.lead'].with_context(active_test=False)

        current_domain = self._lead_domain(company.id, date_from, date_to)
        previous_domain = self._lead_domain(company.id, prev_from, prev_to)
        current_leads = Lead.search(current_domain)
        previous_leads = Lead.search(previous_domain)

        current_opportunities = current_leads.filtered(lambda lead: lead.type == 'opportunity')
        previous_opportunities = previous_leads.filtered(lambda lead: lead.type == 'opportunity')
        current_lead_only = current_leads.filtered(lambda lead: lead.type != 'opportunity')
        previous_lead_only = previous_leads.filtered(lambda lead: lead.type != 'opportunity')
        won_opportunities = current_opportunities.filtered(lambda lead: lead.won_status == 'won')
        lost_opportunities = current_opportunities.filtered(lambda lead: lead.won_status == 'lost')
        pending_opportunities = current_opportunities.filtered(lambda lead: lead.won_status == 'pending')
        previous_won = previous_opportunities.filtered(lambda lead: lead.won_status == 'won')
        today = fields.Date.today()
        overdue = Lead.search([
            ('company_id', 'in', [False, company.id]),
            ('type', '=', 'opportunity'),
            ('active', '=', True),
            ('won_status', '=', 'pending'),
            ('date_deadline', '!=', False),
            ('date_deadline', '<', today),
        ])

        expected_revenue = sum(current_opportunities.mapped('expected_revenue'))
        previous_expected = sum(previous_opportunities.mapped('expected_revenue'))
        won_revenue = sum(won_opportunities.mapped('expected_revenue'))
        previous_won_revenue = sum(previous_won.mapped('expected_revenue'))
        total_opportunities = len(current_opportunities)
        won_count = len(won_opportunities)
        lost_count = len(lost_opportunities)

        kpis = {
            'lead_count': len(current_lead_only),
            'lead_change': self._change(len(current_lead_only), len(previous_lead_only)),
            'opportunity_count': total_opportunities,
            'opportunity_change': self._change(total_opportunities, len(previous_opportunities)),
            'expected_revenue': round(expected_revenue, 2),
            'expected_change': self._change(expected_revenue, previous_expected),
            'won_revenue': round(won_revenue, 2),
            'won_change': self._change(won_revenue, previous_won_revenue),
            'conversion_rate': round(won_count / total_opportunities * 100, 1) if total_opportunities else 0.0,
            'won_count': won_count,
            'lost_count': lost_count,
            'pending_count': len(pending_opportunities),
            'overdue_count': len(overdue),
            'average_probability': round(sum(current_opportunities.mapped('probability')) / total_opportunities, 1) if total_opportunities else 0.0,
            'currency_symbol': company.currency_id.symbol or '$',
            'currency_position': company.currency_id.position or 'before',
        }

        return {
            'kpis': kpis,
            'formula_kpis': self._formula_kpis(current_opportunities, won_opportunities, lost_opportunities),
            'trend': self._trend(current_leads, date_from, date_to),
            'stage_funnel': self._stage_funnel(current_opportunities),
            'status_counts': self._status_counts(current_opportunities),
            'sources': self._many2one_rank(current_leads, 'source_id', 'count'),
            'teams': self._many2one_rank(current_opportunities, 'team_id', 'expected_revenue'),
            'salespeople': self._many2one_rank(current_opportunities, 'user_id', 'expected_revenue'),
            'campaigns': self._many2one_rank(current_leads, 'campaign_id', 'count'),
            'lost_reasons': self._many2one_rank(lost_opportunities, 'lost_reason_id', 'count'),
            'pivot_rows': self._pivot_rows(current_leads),
            'custom_chart': self._custom_chart(current_leads, custom_groupby, custom_measure),
            'recent_records': self._recent_records(company.id),
        }

    def _lead_domain(self, company_id, date_from, date_to):
        date_start = fields.Datetime.to_string(datetime.combine(date_from, datetime.min.time()))
        date_stop = fields.Datetime.to_string(datetime.combine(date_to, datetime.max.time()))
        return [
            ('company_id', 'in', [False, company_id]),
            ('create_date', '>=', date_start),
            ('create_date', '<=', date_stop),
        ]

    def _change(self, current, previous):
        if previous:
            return round((current - previous) / previous * 100, 1)
        return 100.0 if current else 0.0

    def _trend(self, leads, date_from, date_to):
        points = {}
        day = date_from
        while day <= date_to:
            points[day] = {'date': fields.Date.to_string(day), 'leads': 0, 'opportunities': 0}
            day += timedelta(days=1)
        for lead in leads:
            create_day = fields.Date.to_date(lead.create_date)
            if create_day in points:
                if lead.type == 'opportunity':
                    points[create_day]['opportunities'] += 1
                else:
                    points[create_day]['leads'] += 1
        return list(points.values())

    def _stage_funnel(self, opportunities):
        rows = defaultdict(lambda: {'name': '', 'count': 0, 'expected_revenue': 0.0})
        for lead in opportunities:
            stage = lead.stage_id
            key = stage.id or 0
            item = rows[key]
            item['name'] = stage.name or 'No Stage'
            item['count'] += 1
            item['expected_revenue'] += lead.expected_revenue
        return self._rank(rows.values(), 'expected_revenue')

    def _status_counts(self, opportunities):
        values = {'Pending': 0, 'Won': 0, 'Lost': 0}
        for lead in opportunities:
            if lead.won_status == 'won':
                values['Won'] += 1
            elif lead.won_status == 'lost':
                values['Lost'] += 1
            else:
                values['Pending'] += 1
        return values

    def _formula_kpis(self, opportunities, won_opportunities, lost_opportunities):
        expected = sum(opportunities.mapped('expected_revenue'))
        prorated = sum(opportunities.mapped('prorated_revenue'))
        won = sum(won_opportunities.mapped('expected_revenue'))
        total = len(opportunities)
        won_count = len(won_opportunities)
        lost_count = len(lost_opportunities)
        return {
            'weighted_forecast': round(prorated, 2),
            'weighted_formula': 'Expected Revenue x Probability',
            'avg_deal_size': round(expected / total, 2) if total else 0.0,
            'avg_deal_formula': 'Expected Revenue / Opportunities',
            'win_loss_ratio': round(won_count / lost_count, 2) if lost_count else float(won_count),
            'win_loss_formula': 'Won Opportunities / Lost Opportunities',
            'pipeline_to_won': round(expected / won, 2) if won else 0.0,
            'pipeline_formula': 'Expected Revenue / Won Revenue',
        }

    def _pivot_rows(self, leads):
        rows = defaultdict(lambda: {
            'stage': '',
            'lead_count': 0,
            'opportunity_count': 0,
            'expected_revenue': 0.0,
            'prorated_revenue': 0.0,
            'won_count': 0,
            'lost_count': 0,
            'conversion_rate': 0.0,
        })
        for lead in leads:
            stage = lead.stage_id
            key = stage.id or 0
            item = rows[key]
            item['stage'] = stage.name or 'No Stage'
            if lead.type == 'opportunity':
                item['opportunity_count'] += 1
                item['expected_revenue'] += lead.expected_revenue
                item['prorated_revenue'] += lead.prorated_revenue
                if lead.won_status == 'won':
                    item['won_count'] += 1
                elif lead.won_status == 'lost':
                    item['lost_count'] += 1
            else:
                item['lead_count'] += 1
        values = sorted(rows.values(), key=lambda value: value['expected_revenue'], reverse=True)
        for item in values:
            item['expected_revenue'] = round(item['expected_revenue'], 2)
            item['prorated_revenue'] = round(item['prorated_revenue'], 2)
            item['conversion_rate'] = round(item['won_count'] / item['opportunity_count'] * 100, 1) if item['opportunity_count'] else 0.0
        return values

    def _custom_chart(self, leads, groupby, measure):
        groupby = groupby if groupby in self._custom_group_fields() else 'stage_id'
        measure = measure if measure in self._custom_measures() else 'expected_revenue'
        rows = defaultdict(lambda: {'name': '', 'value': 0.0, 'count': 0})
        for lead in leads:
            key, label = self._group_value(lead, groupby)
            item = rows[key]
            item['name'] = label
            item['count'] += 1
            item['value'] += self._measure_value(lead, measure)
        values = sorted(rows.values(), key=lambda value: value['value'], reverse=True)[:12]
        if measure == 'probability':
            for item in values:
                item['value'] = round(item['value'] / item['count'], 1) if item['count'] else 0.0
        else:
            for item in values:
                item['value'] = round(item['value'], 2)
        return values

    def _custom_group_fields(self):
        return {'stage_id', 'team_id', 'user_id', 'source_id', 'campaign_id', 'lost_reason_id', 'type', 'won_status'}

    def _custom_measures(self):
        return {'count', 'expected_revenue', 'prorated_revenue', 'probability'}

    def _group_value(self, lead, groupby):
        value = lead[groupby]
        if hasattr(value, 'display_name'):
            return value.id or 0, value.display_name or 'Undefined'
        if groupby in ('type', 'won_status'):
            selection = dict(lead._fields[groupby].selection)
            return value or 'undefined', selection.get(value, 'Undefined')
        return value or 'undefined', str(value or 'Undefined')

    def _measure_value(self, lead, measure):
        if measure == 'count':
            return 1.0
        return float(lead[measure] or 0.0)

    def _many2one_rank(self, records, field_name, metric, limit=10):
        rows = defaultdict(lambda: {'name': '', 'count': 0, 'expected_revenue': 0.0})
        for record in records:
            related = record[field_name]
            key = related.id or 0
            item = rows[key]
            item['name'] = related.display_name or 'Undefined'
            item['count'] += 1
            item['expected_revenue'] += record.expected_revenue
        return self._rank(rows.values(), metric, limit=limit)

    def _recent_records(self, company_id):
        leads = request.env['crm.lead'].with_context(active_test=False).search([
            ('company_id', 'in', [False, company_id]),
        ], order='create_date desc', limit=12)
        return [{
            'id': lead.id,
            'name': lead.name,
            'customer': lead.partner_id.display_name or lead.partner_name or lead.contact_name or '',
            'salesperson': lead.user_id.name or '',
            'stage': lead.stage_id.name or '',
            'type': 'Opportunity' if lead.type == 'opportunity' else 'Lead',
            'status': dict(lead._fields['won_status'].selection).get(lead.won_status, lead.won_status),
            'expected_revenue': round(lead.expected_revenue, 2),
            'date': fields.Date.to_string(fields.Date.to_date(lead.create_date)),
        } for lead in leads]

    def _rank(self, values, key, limit=10):
        ranked = sorted(values, key=lambda value: value[key], reverse=True)[:limit]
        for item in ranked:
            item['expected_revenue'] = round(item.get('expected_revenue', 0.0), 2)
        return ranked
