import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Box, Button, Card, CardContent, Container, LinearProgress, List, ListItem,
  ListItemText, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, Chip, IconButton,
  Avatar, Divider, Badge, Tooltip as MuiTooltip
} from '@mui/material';
import { 
  Send as SendIcon, 
  Clear as ClearIcon,
  HelpOutline as HelpIcon,
  History as HistoryIcon,
  Lightbulb as SuggestionIcon
} from '@mui/icons-material';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip as ChartTooltip,
  Legend, 
  PointElement, 
  LineElement,
  ArcElement
} from 'chart.js';

// Register ChartJS components with renamed Tooltip
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

// Sample questions for quick access
const SAMPLE_QUESTIONS = [
  "Compare sales between Electronics and Furniture",
  "Show revenue trends over time",
   "Who are our top 10 customers by spending?",
  "What are our most popular products?" ,
  "How has our customer base grown over time?",
  "Show order status distribution",
  "Are there any data quality issues in our database?"
];
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function App() {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSampleQuestions, setShowSampleQuestions] = useState(true);
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

   const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setShowSampleQuestions(false);
    const userMessage = { sender: 'user', content: question };
    setConversation(prev => [...prev, userMessage]);
    setQuestion('');

    try {
      // Modify this line to use the backendUrl variable
      const response = await axios.post(`${backendUrl}/api/query`, { question });
      const aiMessage = { 
        sender: 'ai', 
        content: response.data.response,
        data: response.data.data,
        visualization: response.data.visualization,
        sqlQuery: response.data.sqlQuery,
        questionType: response.data.questionType
      };
      setConversation(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { sender: 'ai', content: `Error: ${error.response?.data?.error || error.message}` };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleQuestion = (question) => {
    setQuestion(question);
  };

  const clearConversation = () => {
    setConversation([]);
    setShowSampleQuestions(true);
  };

  const renderVisualization = (item) => {
    if (!item.visualization) return null;

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { 
          display: true, 
          text: item.content.length > 50 ? `${item.content.substring(0, 50)}...` : item.content,
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += typeof context.parsed.y === 'number' ? 
                  context.parsed.y.toFixed(2) : context.parsed.y;
              }
              return label;
            }
          }
        }
      }
    };

    switch (item.visualization.type) {
      case 'bar':
        return (
          <Box sx={{ height: '400px', mt: 2 }}>
            <Bar
              data={{
                labels: item.visualization.data.map(d => d.x),
                datasets: [{
                  label: item.questionType === 'customer_spending' ? 'Total Spent ($)' : 
                        item.questionType === 'category_comparison' ? 'Sales ($)' : 'Value',
                  data: item.visualization.data.map(d => d.y),
                  backgroundColor: 'rgba(63, 81, 181, 0.7)',
                  borderColor: 'rgba(63, 81, 181, 1)',
                  borderWidth: 1
                }]
              }}
              options={{
                ...commonOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: item.questionType === 'customer_spending' ? 'Total Spent ($)' : 
                            item.questionType === 'category_comparison' ? 'Sales ($)' : 'Value'
                    }
                  }
                }
              }}
            />
          </Box>
        );

      case 'line':
        return (
          <Box sx={{ height: '400px', mt: 2 }}>
            <Line
              data={{
                labels: item.visualization.data.map(d => {
                  if (d.x.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    return new Date(d.x).toLocaleDateString();
                  }
                  return d.x;
                }),
                datasets: [{
                  label: item.questionType === 'customer_growth' ? 'New Customers' : 'Revenue ($)',
                  data: item.visualization.data.map(d => d.y),
                  borderColor: 'rgba(0, 150, 136, 1)',
                  backgroundColor: 'rgba(0, 150, 136, 0.2)',
                  tension: 0.1,
                  fill: true
                }]
              }}
              options={{
                ...commonOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: item.questionType === 'customer_growth' ? 'New Customers' : 'Revenue ($)'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Date'
                    }
                  }
                }
              }}
            />
          </Box>
        );

      case 'pie':
        return (
          <Box sx={{ height: '400px', mt: 2 }}>
            <Pie
              data={{
                labels: item.visualization.data.map(d => d.x),
                datasets: [{
                  data: item.visualization.data.map(d => d.y),
                  backgroundColor: [
                    'rgba(233, 30, 99, 0.7)',
                    'rgba(33, 150, 243, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(0, 150, 136, 0.7)',
                    'rgba(156, 39, 176, 0.7)'
                  ],
                  borderWidth: 1
                }]
              }}
              options={commonOptions}
            />
          </Box>
        );

      case 'table':
        return (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {item.visualization.columns.map((col, i) => (
                    <TableCell key={i} sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {item.visualization.data.map((row, i) => (
                  <TableRow key={i} hover>
                    {row.map((cell, j) => (
                      <TableCell key={j}>
                        {typeof cell === 'number' ? cell.toFixed(2) : String(cell)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              AI
            </Avatar>
            Data Analysis Agent
          </Box>
        </Typography>
        <Box>
          <MuiTooltip title="Clear conversation">
            <IconButton onClick={clearConversation} color="error" sx={{ mr: 1 }}>
              <ClearIcon />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title="Sample questions">
            <IconButton onClick={() => setShowSampleQuestions(!showSampleQuestions)} color="primary">
              <HelpIcon />
            </IconButton>
          </MuiTooltip>
        </Box>
      </Box>

      {showSampleQuestions && (
        <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <SuggestionIcon color="primary" sx={{ mr: 1 }} />
              Try asking:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {SAMPLE_QUESTIONS.map((q, i) => (
                <Chip
                  key={i}
                  label={q}
                  onClick={() => handleSampleQuestion(q)}
                  variant="outlined"
                  color="primary"
                  icon={<HistoryIcon fontSize="small" />}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 2, boxShadow: 3 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                variant="outlined"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a complex analytical question..."
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.dark',
                    },
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !question.trim()}
                endIcon={<SendIcon />}
                sx={{ minWidth: '100px' }}
              >
                {loading ? 'Analyzing...' : 'Ask'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {loading && <LinearProgress color="primary" />}

      <List 
        ref={listRef}
        sx={{ 
          width: '100%',
          maxHeight: '65vh',
          overflow: 'auto',
          pr: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          }
        }}
      >
        {conversation.map((item, index) => (
          <Box key={index}>
            <ListItem alignItems="flex-start" sx={{ pl: 0 }}>
              <Paper elevation={2} sx={{ 
                p: 2, 
                width: '100%', 
                backgroundColor: item.sender === 'user' ? '#f0f7ff' : 'white',
                borderRadius: 2,
                borderLeft: `4px solid ${item.sender === 'user' ? '#1976d2' : '#4caf50'}`
              }}>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          item.sender === 'ai' ? (
                            <Avatar sx={{ 
                              width: 24, 
                              height: 24,
                              bgcolor: 'success.main',
                              fontSize: '0.75rem'
                            }}>
                              AI
                            </Avatar>
                          ) : (
                            <Avatar sx={{ 
                              width: 24, 
                              height: 24,
                              bgcolor: 'primary.main',
                              fontSize: '0.75rem'
                            }}>
                              Y
                            </Avatar>
                          )
                        }
                      >
                        <Avatar sx={{ 
                          bgcolor: item.sender === 'user' ? 'primary.main' : 'success.main',
                          width: 40,
                          height: 40
                        }}>
                          {item.sender === 'user' ? 'You' : 'AI'}
                        </Avatar>
                      </Badge>
                      <Typography fontWeight="bold" color={item.sender === 'user' ? 'primary.main' : 'success.main'}>
                        {item.sender === 'user' ? 'You' : 'Data Analyst'}
                      </Typography>
                      {item.sender === 'ai' && item.questionType && (
                        <Chip 
                          label={item.questionType.replace('_', ' ')} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body1" color="text.primary" whiteSpace="pre-wrap" sx={{ mt: 1, display: 'inline-block' }}>
                        {item.content}
                      </Typography>
                      
                      {item.sender === 'ai' && item.sqlQuery && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="subtitle2" gutterBottom>
                            Generated SQL:
                          </Typography>
                          <Paper elevation={0} sx={{ 
                            p: 1, 
                            backgroundColor: '#f8f8f8', 
                            overflowX: 'auto',
                            borderRadius: 1,
                            borderLeft: '3px solid',
                            borderColor: 'primary.main'
                          }}>
                            <Typography variant="caption" fontFamily="monospace" whiteSpace="pre">
                              {item.sqlQuery}
                            </Typography>
                          </Paper>
                        </>
                      )}

                      {item.sender === 'ai' && renderVisualization(item)}

                      {item.sender === 'ai' && item.data && (
                        <Box mt={2}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="subtitle2" gutterBottom>
                            Raw Data ({item.data.length} rows):
                          </Typography>
                          <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  {Object.keys(item.data[0] || {}).map(key => (
                                    <TableCell key={key} sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>{key}</TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {item.data.slice(0, 10).map((row, i) => (
                                  <TableRow key={i} hover>
                                    {Object.values(row).map((val, j) => (
                                      <TableCell key={j}>
                                        {typeof val === 'number' ? val.toFixed(2) : String(val)}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          {item.data.length > 10 && (
                            <Typography variant="caption">
                              Showing 10 of {item.data.length} rows
                            </Typography>
                          )}
                        </Box>
                      )}
                    </>
                  }
                />
              </Paper>
            </ListItem>
            {index < conversation.length - 1 && <Divider sx={{ my: 1 }} />}
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </List>
    </Container>
  );
}

export default App;