from django.contrib import admin
from django.utils.html import format_html
from .models import Plan, Subscription, Payment


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'price_monthly', 'max_venues', 'max_photos', 'has_analytics']
    list_editable = ['price_monthly']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'expires_at', 'is_active_display']
    list_filter = ['status', 'plan']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['started_at']

    def is_active_display(self, obj):
        color = 'green' if obj.is_active else 'red'
        label = 'Actif' if obj.is_active else 'Inactif'
        return format_html('<span style="color:{}">{}</span>', color, label)
    is_active_display.short_description = 'État'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'method', 'months', 'status', 'created_at', 'actions_display']
    list_filter = ['status', 'method']
    search_fields = ['user__username', 'transaction_id', 'sender_phone']
    readonly_fields = ['created_at', 'confirmed_at', 'screenshot_preview']
    actions = ['confirm_payments', 'reject_payments']

    def screenshot_preview(self, obj):
        if obj.screenshot:
            return format_html('<img src="{}" style="max-width:300px;border-radius:8px"/>', obj.screenshot.url)
        return '—'
    screenshot_preview.short_description = 'Capture'

    def actions_display(self, obj):
        if obj.status == 'pending':
            return format_html(
                '<a href="/admin/subscriptions/payment/{}/change/" style="background:#1B6B4A;color:#fff;padding:3px 8px;border-radius:4px;font-size:11px;">Examiner</a>',
                obj.pk
            )
        return obj.get_status_display()
    actions_display.short_description = 'Action'

    def confirm_payments(self, request, queryset):
        for p in queryset.filter(status='pending'):
            p.confirm()
        self.message_user(request, f'{queryset.count()} paiement(s) confirmé(s)')
    confirm_payments.short_description = '✅ Confirmer les paiements sélectionnés'

    def reject_payments(self, request, queryset):
        queryset.filter(status='pending').update(status='rejected')
        self.message_user(request, f'{queryset.count()} paiement(s) rejeté(s)')
    reject_payments.short_description = '❌ Rejeter les paiements sélectionnés'