from rest_framework import serializers
from .models import Plan, Subscription, Payment


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    is_active = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()

    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'status', 'is_active', 'days_remaining',
                  'started_at', 'expires_at', 'auto_renew']


class PaymentSerializer(serializers.ModelSerializer):
    method_label = serializers.CharField(source='get_method_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'amount', 'method', 'method_label', 'months',
                  'transaction_id', 'sender_phone', 'screenshot',
                  'status', 'status_label', 'created_at', 'confirmed_at', 'admin_note']
        read_only_fields = ['status', 'confirmed_at', 'admin_note']

    def create(self, validated_data):
        user = self.context['request'].user
        sub, _ = Subscription.objects.get_or_create(
            user=user,
            defaults={'plan': Plan.objects.get(slug='free')}
        )
        # Get pro plan
        pro_plan = Plan.objects.get(slug='pro')
        validated_data['user'] = user
        validated_data['subscription'] = sub
        validated_data['amount'] = pro_plan.price_monthly * validated_data.get('months', 1)
        return super().create(validated_data)