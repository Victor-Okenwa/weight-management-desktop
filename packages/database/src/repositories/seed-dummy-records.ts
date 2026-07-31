import { count, like } from 'drizzle-orm';
import type { DatabaseInstance } from '../index.js';
import { records } from '../schema/index.js';
import { createRecord } from './record.js';

const SEED_REMARK_PREFIX = '[seed]';

type DummyRecord = {
  operator: string;
  operationType: 'single' | 'double';
  vehicleName: string;
  materialName: string;
  tareWeight: number;
  grossWeight: number;
  status: 'pending' | 'completed';
  remark: string;
  vehicleTareWeight?: number;
};

const DUMMY_RECORDS: DummyRecord[] = [
  {
    operator: 'Ada Okoro',
    operationType: 'double',
    vehicleName: 'ABC-123-XY',
    materialName: 'Sharp sand',
    tareWeight: 8500,
    grossWeight: 18240,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} inbound delivery`,
    vehicleTareWeight: 8500,
  },
  {
    operator: 'Ben Musa',
    operationType: 'single',
    vehicleName: 'KJA-441-AG',
    materialName: 'Granite',
    tareWeight: 9200,
    grossWeight: 9200,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} tare-only capture`,
    vehicleTareWeight: 9200,
  },
  {
    operator: 'Chioma Eze',
    operationType: 'double',
    vehicleName: 'LAG-908-BJ',
    materialName: 'Laterite',
    tareWeight: 10150,
    grossWeight: 24680,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} quarry load`,
    vehicleTareWeight: 10150,
  },
  {
    operator: 'Daniel Bello',
    operationType: 'double',
    vehicleName: 'ABJ-220-KR',
    materialName: 'Cement',
    tareWeight: 7800,
    grossWeight: 19320,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} bagged cement`,
    vehicleTareWeight: 7800,
  },
  {
    operator: 'Efe Ojo',
    operationType: 'single',
    vehicleName: 'OY-55-TU',
    materialName: 'Iron rods',
    tareWeight: 11200,
    grossWeight: 11200,
    status: 'pending',
    remark: `${SEED_REMARK_PREFIX} awaiting gross`,
    vehicleTareWeight: 11200,
  },
  {
    operator: 'Fatima Yusuf',
    operationType: 'double',
    vehicleName: 'KD-301-LM',
    materialName: 'Asphalt',
    tareWeight: 9650,
    grossWeight: 22110,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} road project`,
    vehicleTareWeight: 9650,
  },
  {
    operator: 'Grace Nwosu',
    operationType: 'double',
    vehicleName: 'EN-774-PQ',
    materialName: 'Gravel',
    tareWeight: 8900,
    grossWeight: 20150,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} site fill`,
    vehicleTareWeight: 8900,
  },
  {
    operator: 'Hassan Ali',
    operationType: 'double',
    vehicleName: 'KN-118-RS',
    materialName: 'Crushed stone',
    tareWeight: 10400,
    grossWeight: 25890,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} crusher output`,
    vehicleTareWeight: 10400,
  },
  {
    operator: 'Ifeanyi Okeke',
    operationType: 'single',
    vehicleName: 'AN-662-VW',
    materialName: 'Palm kernel',
    tareWeight: 7300,
    grossWeight: 7300,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} agri load`,
    vehicleTareWeight: 7300,
  },
  {
    operator: 'Jane Ade',
    operationType: 'double',
    vehicleName: 'OG-449-ZX',
    materialName: 'Diesel',
    tareWeight: 9800,
    grossWeight: 21450,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} tanker`,
    vehicleTareWeight: 9800,
  },
  {
    operator: 'Kunle Bakare',
    operationType: 'double',
    vehicleName: 'OY-812-CD',
    materialName: 'Rice',
    tareWeight: 8600,
    grossWeight: 17640,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} warehouse out`,
    vehicleTareWeight: 8600,
  },
  {
    operator: 'Lola Danjuma',
    operationType: 'double',
    vehicleName: 'PL-503-EF',
    materialName: 'Coal',
    tareWeight: 12000,
    grossWeight: 28900,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} bulk coal`,
    vehicleTareWeight: 12000,
  },
  {
    operator: 'Musa Ibrahim',
    operationType: 'double',
    vehicleName: 'SO-291-GH',
    materialName: 'Fertilizer',
    tareWeight: 9100,
    grossWeight: 19870,
    status: 'pending',
    remark: `${SEED_REMARK_PREFIX} second weigh pending`,
    vehicleTareWeight: 9100,
  },
  {
    operator: 'Ngozi Chukwu',
    operationType: 'double',
    vehicleName: 'IM-640-JK',
    materialName: 'Timber',
    tareWeight: 7950,
    grossWeight: 15220,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} lumber truck`,
    vehicleTareWeight: 7950,
  },
  {
    operator: 'Oscar Peters',
    operationType: 'double',
    vehicleName: 'RV-177-NP',
    materialName: 'Scrap metal',
    tareWeight: 10550,
    grossWeight: 23980,
    status: 'completed',
    remark: `${SEED_REMARK_PREFIX} scrap yard`,
    vehicleTareWeight: 10550,
  },
];

/** Returns true if dummy print-test records were inserted. */
export function seedDummyRecords(db: DatabaseInstance): boolean {
  const existingSeed = db
    .select({ id: records.id })
    .from(records)
    .where(like(records.remark, `${SEED_REMARK_PREFIX}%`))
    .limit(1)
    .get();

  if (existingSeed) {
    return false;
  }

  for (const item of DUMMY_RECORDS) {
    const netWeight =
      item.status === 'completed' && item.operationType === 'double'
        ? item.grossWeight - item.tareWeight
        : item.operationType === 'single' && item.status === 'completed'
          ? item.tareWeight
          : null;

    createRecord(db, {
      operator: item.operator,
      operationType: item.operationType,
      vehicleName: item.vehicleName,
      materialName: item.materialName,
      tareWeight: item.tareWeight,
      grossWeight: item.status === 'completed' ? item.grossWeight : null,
      netWeight: item.status === 'completed' ? netWeight : null,
      status: item.status,
      remark: item.remark,
      vehicleTareWeight: item.vehicleTareWeight ?? item.tareWeight,
      vehicleTareUnit: 'kg',
    });
  }

  return true;
}

export function countRecords(db: DatabaseInstance): number {
  const row = db.select({ value: count() }).from(records).get();
  return row?.value ?? 0;
}
