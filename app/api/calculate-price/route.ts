import { NextRequest, NextResponse } from 'next/server';

type ProductCostInfo = {
  cost_price: number;
  freight_share: number;
  gateway_fee: number;
  iva_tax: number;
  target_margin: number;
};

function applyPsychologicalPricing(calculatedPrice: number): number {
  const integerPart = Math.floor(calculatedPrice);
  const decimalPart = calculatedPrice - integerPart;

  if (decimalPart < 0.5) return integerPart + 0.49;
  if (decimalPart < 0.9) return integerPart + 0.9;
  return integerPart + 1.49;
}

function parseNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ProductCostInfo>;

    const costPrice = parseNumber(body.cost_price);
    const freightShare = parseNumber(body.freight_share);
    const gatewayFee = parseNumber(body.gateway_fee);
    const ivaTax = parseNumber(body.iva_tax);
    const targetMargin = parseNumber(body.target_margin);

    if ([costPrice, freightShare, gatewayFee, ivaTax, targetMargin].some(Number.isNaN)) {
      return NextResponse.json(
        { error: 'Todos os campos devem ser numéricos.' },
        { status: 400 }
      );
    }

    if (costPrice < 0 || freightShare < 0 || gatewayFee < 0 || ivaTax < 0 || targetMargin < 0) {
      return NextResponse.json(
        { error: 'Os valores não podem ser negativos.' },
        { status: 400 }
      );
    }

    const deductions = targetMargin + gatewayFee + ivaTax;

    if (deductions >= 1) {
      return NextResponse.json(
        { error: 'As taxas e margens superam 100%. Impossível calcular.' },
        { status: 400 }
      );
    }

    const basePrice = (costPrice + freightShare) / (1 - deductions);
    const finalPrice = applyPsychologicalPricing(basePrice);

    const actualProfit =
      finalPrice -
      costPrice -
      freightShare -
      finalPrice * (gatewayFee + ivaTax);

    const actualMarginPct = finalPrice > 0 ? (actualProfit / finalPrice) * 100 : 0;

    return NextResponse.json({
      base_price_calculated: Number(basePrice.toFixed(2)),
      suggested_retail_price: Number(finalPrice.toFixed(2)),
      actual_profit_eur: Number(actualProfit.toFixed(2)),
      actual_margin_percentage: Number(actualMarginPct.toFixed(2)),
    });
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível calcular o preço sugerido.' },
      { status: 500 }
    );
  }
}
