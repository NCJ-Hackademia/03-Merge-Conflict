# 📊 Analytics & Insights Features

GhostWriter now includes comprehensive analytics and insights capabilities to help you understand and improve your codebase health and evolution.

## 🎯 Features Overview

### 1. **Code Health Metrics**
- **Cyclomatic Complexity**: Measures code complexity and maintainability
- **Security Score**: Identifies potential security vulnerabilities
- **Comment Ratio**: Tracks documentation coverage
- **Maintainability Index**: Overall code quality assessment
- **Code Smells Detection**: Identifies problematic code patterns

### 2. **Technology Stack Analysis**
- **Language Detection**: Automatically identifies programming languages
- **Framework Detection**: Recognizes popular frameworks (React, Vue, Angular, etc.)
- **Library Detection**: Identifies dependencies and libraries
- **Build Tools**: Detects build systems and package managers
- **Database Detection**: Identifies database technologies
- **Cloud Services**: Recognizes cloud platform usage

### 3. **Code Evolution Tracking**
- **Commit Analysis**: Tracks changes over time
- **Lines Added/Deleted**: Monitors code growth and cleanup
- **Change Patterns**: Categorizes commits (feature, bugfix, refactor, etc.)
- **Impact Assessment**: Evaluates change significance
- **Time-based Analysis**: Tracks development velocity

## 🚀 Getting Started

### Accessing Analytics
1. Open GhostWriter
2. Navigate to the **📊 Analytics** section in the sidebar
3. Select a project from the dropdown
4. Choose your time range (7 days, 30 days, 90 days, or 1 year)
5. View comprehensive insights about your codebase

### Understanding the Dashboard

#### **Overall Health Score**
- **Excellent (80-100)**: Your codebase is in great shape
- **Good (60-79)**: Generally healthy with room for improvement
- **Fair (40-59)**: Some issues that should be addressed
- **Poor (0-39)**: Significant improvements needed

#### **Key Metrics**
- **Maintainability**: How easy it is to modify and extend the code
- **Complexity**: Cyclomatic complexity of functions and methods
- **Security**: Potential security vulnerabilities detected
- **Comments**: Documentation coverage ratio

#### **Technology Stack**
- Shows detected languages, frameworks, and libraries
- File count per technology
- Usage patterns and trends

#### **Evolution Trends**
- Daily/weekly commit activity
- Lines of code changes
- Development velocity patterns

## 🔧 Technical Implementation

### Database Schema
The analytics system uses several new tables:
- `code_metrics`: Stores code health measurements
- `tech_stack_analysis`: Technology detection results
- `code_evolution`: Change tracking data
- `project_analytics`: Aggregated project summaries

### API Endpoints
- `GET /analytics/health/:projectName` - Get health metrics
- `GET /analytics/tech-stack/:projectName` - Get technology stack
- `GET /analytics/evolution/:projectName` - Get evolution trends
- `GET /analytics/summary/:projectName` - Get comprehensive summary

### IPC Handlers
- `analytics:get-project-health` - Frontend health metrics
- `analytics:get-tech-stack` - Technology stack data
- `analytics:get-evolution` - Evolution tracking data
- `analytics:generate-project-analytics` - Full analytics summary

## 🎨 AI-Powered Recommendations

The system provides intelligent recommendations based on your codebase:

### **Code Health Alerts**
- Low maintainability scores
- High complexity warnings
- Security vulnerability alerts
- Documentation gaps

### **Development Insights**
- Active development detection
- Performance optimization suggestions
- Best practices recommendations
- Team productivity insights

## 📈 Future Enhancements

### Planned Features
- **Visual Charts**: Interactive charts and graphs
- **Trend Analysis**: Long-term pattern recognition
- **Team Analytics**: Individual contributor insights
- **Custom Metrics**: User-defined measurement criteria
- **Export Reports**: PDF/HTML analytics reports
- **Integration APIs**: Third-party tool connections

### Advanced Analytics
- **Predictive Analysis**: Future code quality predictions
- **Refactoring Suggestions**: AI-powered improvement recommendations
- **Dependency Analysis**: Impact assessment of changes
- **Performance Metrics**: Runtime performance analysis

## 🛠️ Configuration

### Analytics Settings
The analytics system automatically runs when you ingest code. No additional configuration is required, but you can:

1. **Adjust Time Ranges**: Select different time periods for analysis
2. **Filter Projects**: Focus on specific projects or codebases
3. **Custom Thresholds**: Modify alert thresholds (future feature)

### Performance Considerations
- Analytics processing happens asynchronously during ingestion
- Database queries are optimized with proper indexing
- Large codebases are processed efficiently
- Results are cached for quick dashboard loading

## 🔍 Troubleshooting

### Common Issues
1. **No Data Available**: Ensure you've ingested code for the selected project
2. **Missing Metrics**: Some metrics require specific file types or patterns
3. **Slow Loading**: Large projects may take time to analyze

### Debug Information
- Check the console for analytics processing logs
- Verify database tables are created properly
- Ensure file permissions for database access

## 📚 API Reference

### Frontend API
```typescript
// Get project health metrics
const health = await window.electronAPI.getProjectHealth({
  projectName: "my-project",
  days: 30
});

// Get technology stack
const techStack = await window.electronAPI.getTechStack({
  projectName: "my-project"
});

// Get evolution trends
const evolution = await window.electronAPI.getEvolution({
  projectName: "my-project",
  days: 90
});

// Get comprehensive analytics
const analytics = await window.electronAPI.getProjectAnalytics({
  projectName: "my-project"
});
```

### HTTP API
```bash
# Get health metrics
curl http://localhost:3001/analytics/health/my-project?days=30

# Get technology stack
curl http://localhost:3001/analytics/tech-stack/my-project

# Get evolution data
curl http://localhost:3001/analytics/evolution/my-project?days=90

# Get full summary
curl http://localhost:3001/analytics/summary/my-project
```

## 🎉 Getting the Most Out of Analytics

1. **Regular Monitoring**: Check analytics weekly to track trends
2. **Team Reviews**: Share insights with your development team
3. **Goal Setting**: Use metrics to set improvement targets
4. **Documentation**: Use comment ratio insights to improve docs
5. **Security**: Address security score alerts promptly
6. **Refactoring**: Use complexity metrics to identify refactoring opportunities

---

The analytics system is designed to help you build better, more maintainable code by providing actionable insights into your development practices and codebase health.
