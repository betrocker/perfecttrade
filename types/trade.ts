export interface Trade {
    id: string;
    user_id: string;
    currency_pair: string;
    direction: 'LONG' | 'SHORT';
    entry_price: number | null;
    take_profit_price: number | null;
    stop_loss_price: number | null;
    account_balance: number | null;
    stop_loss_pips: number | null;
    risk_percentage: number | null;
    calculated_lot_size: number | string | null;
    confluence_score: number;
    confluence_data: any;
    notes: string | null;
    chart_image_url: string | null;
    after_trade_image_url: string | null;
    status: 'PLANNED' | 'OPEN' | 'CLOSED';
    profit_loss: number | null;
    exit_price: number | null;
    created_at: string;
    updated_at: string;
}
