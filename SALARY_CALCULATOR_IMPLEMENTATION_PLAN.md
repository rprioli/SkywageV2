# Skywage Salary Calculator System - Implementation Plan

## Document Information

- **Version**: 1.0
- **Date**: January 2025
- **Project**: Skywage V2
- **Reference**: SALARY_CALCULATOR_SPECIFICATION.md

---

## Implementation Philosophy

Following the `.augment-guidelines.md` principles:

- **Iterate on existing patterns** instead of creating new ones
- **Use reusable components** to maintain consistency
- **Prefer simple solutions** and avoid over-engineering
- **Avoid code duplication** by checking existing functionality
- **Keep files under 200-300 lines** and refactor when needed
- **Focus on relevant areas** without touching unrelated code
- **Never mock data** or create fake patterns

---

## Phase-by-Phase Implementation Plan

### **Phase 1: Foundation & Core Calculation Engine**

_Duration: 1-2 weeks_

#### **Objectives:**

- Establish core calculation logic
- Create basic data types and interfaces
- Implement CSV parsing foundation

#### **Tasks:**

**1.1 Create Core Types and Interfaces**

- `src/types/salary-calculator.ts` - Core data types
- `src/types/airline-config.ts` - Airline-specific configurations
- Follow existing type patterns in codebase

**1.2 Implement Calculation Engine**

- `src/lib/salary-calculator/calculation-engine.ts` - Core calculation logic
- `src/lib/salary-calculator/time-calculator.ts` - Time parsing and duration calculations
- `src/lib/salary-calculator/flight-classifier.ts` - Turnaround vs layover detection
- Keep each file under 200 lines, split if needed

**1.3 CSV Parser Foundation**

- `src/lib/salary-calculator/csv-parser.ts` - Basic CSV parsing
- `src/lib/salary-calculator/csv-validator.ts` - File validation logic
- `src/lib/salary-calculator/airlines/flydubai-parser.ts` - Flydubai-specific parsing
- Use existing file handling patterns from codebase

**1.4 Unit Tests**

- Test calculation accuracy for all scenarios
- Test time parsing with cross-day handling
- Test flight type classification
- Use existing testing patterns

#### **Deliverables:**

- Core calculation engine with 100% accuracy
- CSV parsing with validation
- Comprehensive unit tests
- No UI components yet

---

### **Phase 2: Database Schema & Basic Infrastructure**

_Duration: 1 week_

#### **Objectives:**

- Implement database schema with audit trail
- Create basic data access layer
- Establish Supabase integration patterns

#### **Tasks:**

**2.1 Database Schema Implementation**

- Apply database migrations for new tables
- Implement RLS policies
- Create indexes for performance

**2.2 Data Access Layer**

- `src/lib/database/flights.ts` - Flight operations
- `src/lib/database/calculations.ts` - Monthly calculation operations
- `src/lib/database/audit.ts` - Audit trail operations
- Follow existing Supabase patterns in codebase

**2.3 Basic UI Components**

- Create reusable components following existing patterns
- Use established ShadCN components
- Follow Skywage brand colors and styling

#### **Deliverables:**

- Complete database schema
- Data access layer with RLS
- Basic UI component foundation

---

### **Phase 3: CSV Upload & Processing Workflow**

_Duration: 1-2 weeks_

#### **Objectives:**

- Implement complete CSV upload functionality
- Create processing workflow with progress tracking
- Establish error handling patterns

#### **Tasks:**

**3.1 File Upload Component**

- Extend existing file upload patterns
- Add CSV-specific validation
- Implement progress indicators

**3.2 Processing Workflow**

- Background processing for large files
- Progress tracking and user feedback
- Error handling and recovery

**3.3 Results Display**

- Monthly calculation summary
- Flight duties table
- Salary breakdown component

#### **Deliverables:**

- Complete CSV upload and processing
- Results display with existing UI patterns
- Robust error handling

---

### **Phase 4: Manual Flight Entry**

_Duration: 2 weeks_

#### **Objectives:**

- Implement manual flight entry forms
- Add real-time validation
- Create dynamic form components

#### **Tasks:**

**4.1 Flight Entry Forms**

- Dynamic forms based on flight type
- Real-time validation with error display
- Auto-complete for common values

**4.2 Validation Engine**

- Client-side validation for immediate feedback
- Server-side validation for data integrity
- Cross-validation for layover pairs

**4.3 Integration with Calculation Engine**

- Real-time calculation preview
- Immediate payment calculation
- Integration with existing calculation logic

#### **Deliverables:**

- Complete manual entry functionality
- Real-time validation and feedback
- Seamless integration with calculation engine

---

### **Phase 5: Edit Functionality & Real-time Recalculation**

_Duration: 2 weeks_

#### **Objectives:**

- Implement edit functionality for all flights
- Add real-time recalculation engine
- Create audit trail system

#### **Tasks:**

**5.1 Edit Components**

- Edit modal with pre-populated data
- Same validation as manual entry
- Impact preview before saving

**5.2 Recalculation Engine**

- Dependency management for layover pairs
- Cascading updates for monthly totals
- Performance optimization for large datasets

**5.3 Audit Trail**

- Track all changes with user attribution
- Display change history
- Rollback capabilities

#### **Deliverables:**

- Complete edit functionality
- Real-time recalculation system
- Comprehensive audit trail

---

### **Phase 6: Enhanced UI & User Experience**

_Duration: 1-2 weeks_

#### **Objectives:**

- Polish user interface
- Add advanced features
- Optimize performance

#### **Tasks:**

**6.1 UI Enhancements**

- Advanced table features (sorting, filtering)
- Bulk operations
- Keyboard shortcuts

**6.2 User Experience**

- Loading states and animations
- Better error messages
- Confirmation dialogs

**6.3 Performance Optimization**

- Lazy loading for large datasets
- Optimistic updates
- Caching strategies

#### **Deliverables:**

- Polished user interface
- Enhanced user experience
- Optimized performance

---

### **Phase 7: Testing & Quality Assurance**

_Duration: 1 week_

#### **Objectives:**

- Comprehensive testing across all features
- Performance testing
- User acceptance testing

#### **Tasks:**

**7.1 Integration Testing**

- End-to-end workflow testing
- Multi-user scenario testing
- Data integrity validation

**7.2 Performance Testing**

- Large dataset handling
- Concurrent user testing
- Database performance optimization

**7.3 User Acceptance Testing**

- Real-world scenario testing
- Feedback collection and implementation
- Final bug fixes

#### **Deliverables:**

- Fully tested system
- Performance benchmarks
- User acceptance sign-off

---

### **Phase 8: Documentation & Deployment**

_Duration: 1 week_

#### **Objectives:**

- Complete documentation
- Deployment preparation
- User training materials

#### **Tasks:**

**8.1 Technical Documentation**

- Code documentation
- API documentation
- Deployment guides

**8.2 User Documentation**

- User manual
- Training materials
- FAQ and troubleshooting

**8.3 Deployment**

- Production deployment
- Monitoring setup
- Backup procedures

#### **Deliverables:**

- Complete documentation
- Production-ready deployment
- User training materials

---

## Development Guidelines

### **Code Organization**

```
src/
├── components/
│   ├── salary-calculator/
│   │   ├── RosterUpload.tsx
│   │   ├── ManualFlightEntry.tsx
│   │   ├── EditFlightModal.tsx
│   │   ├── FlightDutiesTable.tsx
│   │   └── SalaryBreakdown.tsx
├── lib/
│   ├── salary-calculator/
│   │   ├── calculation-engine.ts
│   │   ├── csv-parser.ts
│   │   ├── flight-classifier.ts
│   │   ├── time-calculator.ts
│   │   └── airlines/
│   │       ├── flydubai-config.ts
│   │       ├── flydubai-parser.ts
│   │       └── airline-types.ts
│   ├── database/
│   │   ├── flights.ts
│   │   ├── calculations.ts
│   │   └── audit.ts
├── types/
│   ├── salary-calculator.ts
│   └── airline-config.ts
└── app/
    └── dashboard/
        └── salary-calculator/
            ├── page.tsx
            ├── upload/
            ├── manual/
            └── edit/
```

### **Component Patterns**

- Follow existing ShadCN component usage
- Use established form patterns
- Maintain consistent error handling
- Follow Skywage brand guidelines

### **Airline Configuration Pattern**

```typescript
// Generic component with airline-specific config
<SalaryCalculator
  airline="flydubai"
  config={flydubaiConfig}
/>;

// Airline-specific configuration
const flydubaiConfig: AirlineConfig = {
  name: "Flydubai",
  csvParser: FlydubaiCSVParser,
  rates: FLYDUBAI_RATES,
  validation: FLYDUBAI_VALIDATION_RULES,
  positions: ["CCM", "SCCM"],
};
```

### **Data Flow**

- Use existing Supabase patterns
- Maintain RLS policy consistency
- Follow established state management
- Use existing loading and error states

### **Testing Strategy**

- Unit tests for all calculation logic
- Integration tests for database operations
- Component tests for UI interactions
- End-to-end tests for complete workflows

---

## Risk Mitigation

### **Technical Risks**

- **Complex calculations**: Extensive unit testing and validation
- **Performance with large datasets**: Implement pagination and optimization
- **Data integrity**: Comprehensive validation and audit trails

### **User Experience Risks**

- **Learning curve**: Intuitive UI following existing patterns
- **Data loss**: Robust backup and recovery procedures
- **Calculation errors**: Multiple validation layers and testing

### **Integration Risks**

- **Existing system conflicts**: Careful integration with existing patterns
- **Database performance**: Proper indexing and query optimization
- **User permissions**: Maintain existing RLS patterns

---

## Success Metrics

### **Technical Metrics**

- **Calculation Accuracy**: 100% precision with no rounding errors
- **Performance**: Sub-5-second processing for typical rosters
- **Reliability**: 99.9% uptime with robust error handling
- **Test Coverage**: 90%+ code coverage

### **User Metrics**

- **User Adoption**: 90%+ of target users actively using system
- **User Satisfaction**: 4.5+ rating on usability surveys
- **Error Rate**: <1% user-reported calculation errors
- **Support Tickets**: <5% of users requiring support

### **Business Metrics**

- **Time Savings**: 80% reduction in manual calculation time
- **Accuracy Improvement**: 99%+ calculation accuracy vs manual
- **User Productivity**: Faster salary verification and planning

---

## Conclusion

This implementation plan provides a structured approach to building the Skywage Salary Calculator system while adhering to established development guidelines. Each phase builds upon the previous one, ensuring a stable and maintainable system that integrates seamlessly with the existing Skywage infrastructure.

The phased approach allows for:

- **Incremental delivery** with testable milestones
- **Risk mitigation** through early validation
- **User feedback integration** throughout development
- **Quality assurance** at each phase
- **Maintainable codebase** following established patterns

Regular testing and user feedback after each phase will ensure the final system meets all requirements and provides an excellent user experience.
