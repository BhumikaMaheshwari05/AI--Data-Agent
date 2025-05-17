require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize } = require('sequelize');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await sequelize.query('SELECT NOW()', { type: Sequelize.QueryTypes.SELECT });
    res.json({ time: result[0].now });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});


// Enhanced schema analysis
async function analyzeDatabaseSchema() {
  try {
    const tables = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const schema = {};
    for (const table of tables) {
      const columns = await sequelize.query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = $1`,
        { 
          bind: [table.table_name],
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      // Sample data to infer actual content
      const sampleData = await sequelize.query(
        `SELECT * FROM "${table.table_name}" LIMIT 5`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      schema[table.table_name] = columns.map(col => ({
        ...col,
        sampleValues: sampleData.map(row => row[col.column_name])
      }));
    }
    return schema;
  } catch (error) {
    console.error('Schema analysis failed:', error);
    throw new Error('Failed to analyze database schema');
  }
}

// Improved question classification
function classifyQuestion(question) {
  const lowerQuestion = question.toLowerCase();
  
  if (/(compare|difference).*(sales|revenue|amount).*(electronics|furniture)/i.test(question)) {
    return 'category_comparison';
  }
  
  if (/revenue.*(trend|over time)/i.test(question)) {
    return 'revenue_trend';
  }
  
  if (/top.*customer.*spend/i.test(question)) {
    return 'customer_spending';
  }
  
  if (/(most|top).*(popular|selling).*product/i.test(question)) {
    return 'product_popularity';
  }
  
  if (/order.*status/i.test(question)) {
    return 'order_status';
  }
  
  if (/(data quality|dirty data|invalid)/i.test(question)) {
    return 'data_quality';
  }
  
  if (/(customer base|customer growth|customer acquisition).*(over time|trend)/i.test(question) || 
      /how has our customer base grown/i.test(question)) {
    return 'customer_growth';
  }
  
  return 'general';
}

// SQL generation for different question types
async function generateSQL(questionType, schema) {
  const ordersTable = Object.keys(schema).find(t => t.toLowerCase().includes('ordr'));
  const productsTable = Object.keys(schema).find(t => t.toLowerCase().includes('prdct'));
  const customersTable = Object.keys(schema).find(t => t.toLowerCase().includes('cust'));
  const metricsTable = Object.keys(schema).find(t => t.toLowerCase().includes('metric'));

  switch (questionType) {
    case 'category_comparison':
      return {
        sql: `SELECT 
                p.p_category AS category,
                COUNT(DISTINCT o.order_id) AS order_count,
                SUM(o.amount)::float AS total_sales,
                AVG(o.amount)::float AS avg_order_value
              FROM ${ordersTable} o
              JOIN ${productsTable} p ON p.p_id = ANY(o.product_ids)
              WHERE p.p_category IN ('Electronics', 'Furniture')
                AND o.status = 'completed'
              GROUP BY p.p_category
              ORDER BY total_sales DESC`,
        visualization: 'bar'
      };

    case 'revenue_trend':
      return {
        sql: `SELECT 
                metric_date AS date,
                metric_value AS revenue
              FROM ${metricsTable}
              WHERE metric_type = 'revenue'
                AND metric_value IS NOT NULL
                AND metric_date IS NOT NULL
              ORDER BY metric_date`,
        visualization: 'line'
      };

    case 'customer_spending':
      return {
        sql: `SELECT 
                c.col1 AS customer_name,
                SUM(o.amount)::float AS total_spent,
                COUNT(o.order_id) AS order_count
              FROM ${customersTable} c
              JOIN ${ordersTable} o ON c.id = o.cust_id
              WHERE o.status = 'completed'
              GROUP BY c.col1
              ORDER BY total_spent DESC
              LIMIT 10`,
        visualization: 'bar'
      };

    case 'product_popularity':
      return {
        sql: `SELECT 
                p.p_name AS product,
                p.p_category AS category,
                COUNT(o.order_id) AS times_ordered,
                SUM(o.amount)::float AS revenue_generated
              FROM ${productsTable} p
              JOIN ${ordersTable} o ON p.p_id = ANY(o.product_ids)
              WHERE o.status = 'completed'
              GROUP BY p.p_name, p.p_category
              ORDER BY times_ordered DESC
              LIMIT 5`,
        visualization: 'pie'
      };

    case 'order_status':
      return {
        sql: `SELECT 
                status,
                COUNT(order_id) AS count,
                SUM(amount)::float AS total_amount
              FROM ${ordersTable}
              GROUP BY status`,
        visualization: 'pie'
      };

    case 'data_quality':
      return {
        sql: `SELECT 
                'cust_info' AS table_name,
                SUM(CASE WHEN col1 IS NULL OR col1 = '' THEN 1 ELSE 0 END) AS missing_names,
                SUM(CASE WHEN col2 NOT LIKE '%@%.%' THEN 1 ELSE 0 END) AS invalid_emails,
                SUM(CASE WHEN col3 ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN 0 ELSE 1 END) AS invalid_dates
              FROM ${customersTable}
              
              UNION ALL
              
              SELECT 
                'ordrs' AS table_name,
                SUM(CASE WHEN cust_id IS NULL THEN 1 ELSE 0 END) AS missing_customer_ids,
                SUM(CASE WHEN amount <= 0 THEN 1 ELSE 0 END) AS invalid_amounts,
                SUM(CASE WHEN status NOT IN ('completed', 'pending', 'cancelled') THEN 1 ELSE 0 END) AS invalid_statuses
              FROM ${ordersTable}`,
        visualization: 'table'
      };
    case 'customer_growth':
      return {
        sql: `SELECT 
                metric_date AS date,
                metric_value AS new_customers
              FROM ${metricsTable}
              WHERE metric_type = 'new_customers'
                AND metric_date IS NOT NULL
              ORDER BY metric_date`,
        visualization: 'line'
      };

    default:
      return {
        sql: `SELECT * FROM ${customersTable} LIMIT 10`,
        visualization: 'table'
      };
  }
}

// Enhanced response generation
function generateResponse(questionType, data) {
  switch (questionType) {
    case 'category_comparison':
      if (!data || data.length === 0) {
        return {
          response: "No sales data found for the specified categories.",
          visualizationData: null
        };
      }

      const electronics = data.find(d => d.category === 'Electronics');
      const furniture = data.find(d => d.category === 'Furniture');
      
      let comparisonText = '';
      if (electronics && furniture) {
        const difference = electronics.total_sales - furniture.total_sales;
        const percentageDiff = (Math.abs(difference) / furniture.total_sales * 100).toFixed(1);
        comparisonText = `Electronics sales are $${difference > 0 ? 'higher' : 'lower'} by $${Math.abs(difference).toFixed(2)} (${percentageDiff}%) compared to Furniture.`;
      }

      return {
        response: `Category comparison analysis:\n` +
                 `• Electronics: $${electronics?.total_sales.toFixed(2) || '0.00'} from ${electronics?.order_count || 0} orders (avg $${electronics?.avg_order_value.toFixed(2) || '0.00'})\n` +
                 `• Furniture: $${furniture?.total_sales.toFixed(2) || '0.00'} from ${furniture?.order_count || 0} orders (avg $${furniture?.avg_order_value.toFixed(2) || '0.00'})\n` +
                 comparisonText,
        visualizationData: {
          type: 'bar',
          data: data.map(item => ({
            x: item.category,
            y: item.total_sales,
            orderCount: item.order_count,
            avgValue: item.avg_order_value
          })),
          options: {
            plugins: {
              tooltip: {
                callbacks: {
                  afterLabel: function(context) {
                    return `Orders: ${context.raw.orderCount}\nAvg: $${context.raw.avgValue.toFixed(2)}`;
                  }
                }
              }
            }
          }
        }
      };

    case 'revenue_trend':
      const validRevenueData = data.filter(item => item.revenue && !isNaN(item.revenue));
      if (validRevenueData.length === 0) {
        return {
          response: "No valid revenue data available for analysis.",
          visualizationData: null
        };
      }

      const revenueByMonth = validRevenueData.reduce((acc, item) => {
        const month = new Date(item.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + parseFloat(item.revenue);
        return acc;
      }, {});

      const monthlyTrend = Object.entries(revenueByMonth).map(([month, revenue]) => ({
        x: month,
        y: revenue
      }));

      const totalRevenueAmount = monthlyTrend.reduce((sum, item) => sum + item.y, 0);
      const avgMonthlyRevenue = totalRevenueAmount / monthlyTrend.length;
      const peakRevenueMonth = monthlyTrend.reduce((max, item) => item.y > max.y ? item : max, monthlyTrend[0]);

      return {
        response: `Revenue Trend Analysis:\n` +
                 `• Total Revenue: $${totalRevenueAmount.toFixed(2)}\n` +
                 `• Average Monthly Revenue: $${avgMonthlyRevenue.toFixed(2)}\n` +
                 `• Peak Month: ${peakRevenueMonth.x} ($${peakRevenueMonth.y.toFixed(2)})\n` +
                 `• Growth Trend: ${monthlyTrend.length > 1 ? (monthlyTrend[monthlyTrend.length-1].y > monthlyTrend[0].y ? 'Upward' : 'Downward') : 'Not enough data'}`,
        visualizationData: {
          type: 'line',
          data: monthlyTrend,
          options: {
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Revenue ($)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Month'
                }
              }
            }
          }
        }
      };

    case 'customer_spending':
      if (!data || data.length === 0) {
        return {
          response: "No customer spending data available.",
          visualizationData: null
        };
      }

      const topSpenders = data.slice(0, 5);
      const totalCustomerSpending = data.reduce((sum, item) => sum + item.total_spent, 0);
      const avgSpend = totalCustomerSpending / data.length;

      return {
        response: `Customer Spending Analysis:\n` +
                 `• Total across all customers: $${totalCustomerSpending.toFixed(2)}\n` +
                 `• Average customer spend: $${avgSpend.toFixed(2)}\n` +
                 `Top 5 Customers:\n` +
                 topSpenders.map(c => `• ${c.customer_name}: $${c.total_spent.toFixed(2)} (${c.order_count} orders)`).join('\n'),
        visualizationData: {
          type: 'bar',
          data: topSpenders.map(item => ({
            x: item.customer_name,
            y: item.total_spent,
            orders: item.order_count
          })),
          options: {
            plugins: {
              tooltip: {
                callbacks: {
                  afterLabel: function(context) {
                    return `Orders: ${context.raw.orders}`;
                  }
                }
              }
            }
          }
        }
      };

    case 'product_popularity':
      if (!data || data.length === 0) {
        return {
          response: "No product popularity data available.",
          visualizationData: null
        };
      }

      const topProducts = data.slice(0, 5);
      const totalProductsRevenue = data.reduce((sum, item) => sum + item.revenue_generated, 0);
      const marketShare = topProducts.map(p => ({
        product: `${p.product} (${p.category})`,
        share: (p.revenue_generated / totalProductsRevenue * 100).toFixed(1)
      }));

      return {
        response: `Product Popularity Analysis:\n` +
                 `• Total Revenue: $${totalProductsRevenue.toFixed(2)}\n` +
                 `Top Products by Market Share:\n` +
                 marketShare.map(p => `• ${p.product}: ${p.share}%`).join('\n'),
        visualizationData: {
          type: 'pie',
          data: topProducts.map(item => ({
            x: `${item.product} (${item.category})`,
            y: item.times_ordered,
            revenue: item.revenue_generated
          })),
          options: {
            plugins: {
              tooltip: {
                callbacks: {
                  afterLabel: function(context) {
                    return `Revenue: $${context.raw.revenue.toFixed(2)}`;
                  }
                }
              }
            }
          }
        }
      };

    case 'order_status':
      if (!data || data.length === 0) {
        return {
          response: "No order status data available.",
          visualizationData: null
        };
      }

      const totalOrders = data.reduce((sum, item) => sum + item.count, 0);
      const statusAnalysis = data.map(item => ({
        ...item,
        percentage: (item.count / totalOrders * 100).toFixed(1)
      }));

      return {
        response: `Order Status Analysis:\n` +
                 `• Total Orders: ${totalOrders}\n` +
                 statusAnalysis.map(s => `• ${s.status}: ${s.count} (${s.percentage}%) - $${s.total_amount.toFixed(2)}`).join('\n'),
        visualizationData: {
          type: 'pie',
          data: statusAnalysis.map(item => ({
            x: `${item.status} (${item.percentage}%)`,
            y: item.count,
            amount: item.total_amount
          })),
          options: {
            plugins: {
              tooltip: {
                callbacks: {
                  afterLabel: function(context) {
                    return `Revenue: $${context.raw.amount.toFixed(2)}`;
                  }
                }
              }
            }
          }
        }
      };

    case 'data_quality':
      if (!data || data.length === 0) {
        return {
          response: "No data quality metrics available.",
          visualizationData: null
        };
      }

      const totalIssues = data.reduce((sum, item) => 
        sum + item.missing_names + item.invalid_emails + item.invalid_dates +
        (item.missing_customer_ids || 0) + (item.invalid_amounts || 0) + (item.invalid_statuses || 0), 0);

      return {
        response: `Data Quality Report:\n` +
                 `• Total Issues Found: ${totalIssues}\n` +
                 data.map(t => `• ${t.table_name}:\n` +
                   `  - Missing Names: ${t.missing_names}\n` +
                   `  - Invalid Emails: ${t.invalid_emails}\n` +
                   `  - Invalid Dates: ${t.invalid_dates}` +
                   (t.missing_customer_ids ? `\n  - Missing Customer IDs: ${t.missing_customer_ids}` : '') +
                   (t.invalid_amounts ? `\n  - Invalid Amounts: ${t.invalid_amounts}` : '') +
                   (t.invalid_statuses ? `\n  - Invalid Statuses: ${t.invalid_statuses}` : '')
                 ).join('\n'),
        visualizationData: {
          type: 'table',
          columns: ['Metric', 'Customers', 'Orders'],
          data: [
            ['Missing Data', data[0].missing_names, data[1]?.missing_customer_ids || 'N/A'],
            ['Invalid Data', data[0].invalid_emails + data[0].invalid_dates, 
             (data[1]?.invalid_amounts || 0) + (data[1]?.invalid_statuses || 0)]
          ]
        }
      };

    case 'customer_growth':
      if (!data || data.length === 0) {
        return {
          response: "No customer growth data available.",
          visualizationData: null
        };
      }

      const monthlyGrowth = data.reduce((acc, item) => {
        const month = new Date(item.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + parseInt(item.new_customers);
        return acc;
      }, {});

      const growthData = Object.entries(monthlyGrowth).map(([month, customers]) => ({
        x: month,
        y: customers
      }));

      const totalNewCustomers = growthData.reduce((sum, item) => sum + item.y, 0);
      const peakGrowthMonth = growthData.reduce((max, item) => item.y > max.y ? item : max, growthData[0]);
      const growthRate = growthData.length > 1 ? 
        ((growthData[growthData.length-1].y - growthData[0].y) / growthData[0].y * 100).toFixed(1) : 0;

      return {
        response: `Customer Growth Analysis:\n` +
                 `• Total New Customers: ${totalNewCustomers}\n` +
                 `• Peak Acquisition Month: ${peakGrowthMonth.x} (${peakGrowthMonth.y} customers)\n` +
                 `• Growth Rate: ${growthRate}% over period\n` +
                 `Monthly Breakdown:\n` +
                 growthData.map(m => `• ${m.x}: ${m.y} customers`).join('\n'),
        visualizationData: {
          type: 'line',
          data: growthData,
          options: {
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'New Customers'
                },
                beginAtZero: true
              },
              x: {
                title: {
                  display: true,
                  text: 'Month'
                }
              }
            }
          }
        }
      };

    default:
      return {
        response: `Here are the first ${data?.length || 0} records from the database.`,
        visualizationData: {
          type: 'table',
          columns: data?.length > 0 ? Object.keys(data[0]) : [],
          data: data?.map(item => Object.values(item)) || []
        }
      };
  }
}

// API endpoint
app.post('/api/query', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) throw new Error('Question is required');

    // 1. Get schema
    const schema = await analyzeDatabaseSchema();
    
    // 2. Classify question and generate SQL
    const questionType = classifyQuestion(question);
    const { sql: sqlQuery, visualization } = await generateSQL(questionType, schema);
    
    // 3. Execute query
    const data = await sequelize.query(sqlQuery, {
      type: Sequelize.QueryTypes.SELECT,
      timeout: 10000
    });
    
    // 4. Generate response and visualization
    const { response, visualizationData } = generateResponse(questionType, data);
    
    res.json({
      question,
      questionType,
      sqlQuery,
      data,
      response,
      visualization: visualizationData
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});