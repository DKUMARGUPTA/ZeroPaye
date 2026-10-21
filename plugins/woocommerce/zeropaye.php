<?php
/**
 * ZeroPaye — WooCommerce Plugin
 * v4.3: PHP snippet for WordPress/WooCommerce integration
 * License: AGPL-3.0
 * 
 * Installation:
 * 1. Copy to wp-content/plugins/zeropaye/zeropaye.php
 * 2. Activate in WordPress admin → Plugins
 * 3. Configure: WooCommerce → Settings → Payments → ZeroPaye
 */

if (!defined('ABSPATH')) exit;

add_filter('woocommerce_payment_gateways', function($gateways) {
    $gateways[] = 'WC_Gateway_ZeroPaye';
    return $gateways;
});

add_action('plugins_loaded', function() {
    if (!class_exists('WC_Payment_Gateway')) return;

    class WC_Gateway_ZeroPaye extends WC_Payment_Gateway {
        public function __construct() {
            $this->id = 'zeropaye';
            $this->has_fields = false;
            $this->method_title = 'ZeroPaye (UPI, 0% Fee)';
            $this->method_description = 'Accept UPI payments with 0% fees. Direct-to-bank settlement.';
            $this->init_form_fields();
            $this->init_settings();
            $this->title = $this->get_option('title');
            $this->description = $this->get_option('description');
            $this->server_url = $this->get_option('server_url');
            $this->public_key = $this->get_option('public_key');
            $this->webhook_secret = $this->get_option('webhook_secret');
            add_action('woocommerce_api_wc_gateway_zeropaye', [$this, 'handle_webhook']);
        }

        public function init_form_fields() {
            $this->form_fields = [
                'enabled' => ['title' => 'Enable', 'type' => 'checkbox', 'label' => 'Enable ZeroPaye', 'default' => 'no'],
                'title' => ['title' => 'Title', 'type' => 'text', 'default' => 'UPI (ZeroPaye — 0% Fee)'],
                'description' => ['title' => 'Description', 'type' => 'textarea', 'default' => 'Pay via UPI with 0% fees.'],
                'server_url' => ['title' => 'Server URL', 'type' => 'text', 'default' => 'https://pay.yourdomain.com'],
                'public_key' => ['title' => 'Public API Key', 'type' => 'text'],
                'webhook_secret' => ['title' => 'Webhook Secret', 'type' => 'password'],
            ];
        }

        public function process_payment($order_id) {
            $order = wc_get_order($order_id);
            $amount = $order->get_total();
            $response = wp_remote_post($this->server_url . '/api/zeropaye/session', [
                'headers' => ['Content-Type' => 'application/json'],
                'body' => json_encode([
                    'orderId' => 'WC-' . $order_id,
                    'amount' => $amount,
                    'currency' => $order->get_currency(),
                    'description' => 'WooCommerce Order #' . $order_id,
                    'publicApiKey' => $this->public_key,
                ]),
                'timeout' => 15,
            ]);
            $body = json_decode(wp_remote_retrieve_body($response), true);
            if (!isset($body['session']['id'])) {
                wc_add_notice('Payment error: Could not create session', 'error');
                return;
            }
            $order->update_meta_data('_zeropaye_session_id', $body['session']['id']);
            $order->save();
            return ['result' => 'success', 'redirect' => $this->server_url . '/checkout/' . $body['session']['id']];
        }

        public function handle_webhook() {
            $raw = file_get_contents('php://input');
            $sig_header = $_SERVER['HTTP_X_ZEROPAYE_SIGNATURE'] ?? '';
            $parts = [];
            foreach (explode(',', $sig_header) as $part) {
                $kv = explode('=', $part, 2);
                if (count($kv) === 2) $parts[$kv[0]] = $kv[1];
            }
            if (!isset($parts['t']) || !isset($parts['v1'])) { http_response_code(401); exit; }
            $expected = hash_hmac('sha256', $parts['t'] . '.' . $raw, $this->webhook_secret);
            if (!hash_equals($expected, $parts['v1'])) { http_response_code(401); exit; }
            if (abs(time() - intval($parts['t'])) > 300) { http_response_code(401); exit; }
            $event = json_decode($raw, true);
            if ($event['event'] === 'SUCCESS') {
                $order_id = intval(str_replace('WC-', '', $event['orderId']));
                $order = wc_get_order($order_id);
                if ($order && $order->get_status() !== 'processing') {
                    $expected_paise = intval(round($order->get_total() * 100));
                    if (abs($event['amountPaise'] - $expected_paise) <= 99) {
                        $order->update_status('processing', 'Payment confirmed via ZeroPaye. UTR: ' . $event['utr']);
                    }
                }
            }
            http_response_code(200);
            exit(json_encode(['received' => true]));
        }
    }
});
