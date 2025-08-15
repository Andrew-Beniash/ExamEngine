import { Tip } from '../shared/types/database';

export const sampleTips: Tip[] = [
  {
    id: 'tip-planning-approach',
    topicIds: ['planning'],
    title: 'Choosing the Right Business Analysis Approach',
    body: `<h2>Understanding Business Analysis Approaches</h2>
    <p>Selecting the appropriate business analysis approach is crucial for project success. Consider these key factors:</p>
    
    <h3>Predictive (Plan-Driven) Approach</h3>
    <ul>
      <li><strong>Best for:</strong> Well-defined requirements, stable environment</li>
      <li><strong>Characteristics:</strong> Detailed upfront planning, formal documentation</li>
      <li><strong>Example:</strong> Regulatory compliance projects</li>
    </ul>
    
    <h3>Adaptive (Change-Driven) Approach</h3>
    <ul>
      <li><strong>Best for:</strong> Emerging requirements, dynamic environment</li>
      <li><strong>Characteristics:</strong> Iterative, flexible, collaborative</li>
      <li><strong>Example:</strong> Innovation projects, startup environments</li>
    </ul>
    
    <blockquote>
      <p><strong>Pro Tip:</strong> Most projects benefit from a hybrid approach that combines elements of both predictive and adaptive methodologies.</p>
    </blockquote>
    
    <h3>Key Decision Factors</h3>
    <ol>
      <li>Requirements certainty and stability</li>
      <li>Stakeholder availability and engagement</li>
      <li>Project timeline and budget constraints</li>
      <li>Organizational culture and capabilities</li>
      <li>Regulatory and compliance requirements</li>
    </ol>`,
    packId: 'cbap-fundamentals',
  },
  
  {
    id: 'tip-stakeholder-analysis',
    topicIds: ['stakeholder', 'planning'],
    title: 'Effective Stakeholder Analysis Techniques',
    body: `<h2>Stakeholder Analysis: A Strategic Approach</h2>
    <p>Successful business analysis depends on identifying and understanding all stakeholders. Use these proven techniques:</p>
    
    <h3>1. Stakeholder Identification Matrix</h3>
    <p>Create a comprehensive list using these categories:</p>
    <ul>
      <li><strong>Primary:</strong> Directly affected by the solution</li>
      <li><strong>Secondary:</strong> Indirectly impacted</li>
      <li><strong>Key Players:</strong> Decision makers and influencers</li>
      <li><strong>Shadow:</strong> Unofficial influencers</li>
    </ul>
    
    <h3>2. Power-Interest Grid</h3>
    <p>Plot stakeholders based on their level of power and interest:</p>
    <ul>
      <li><strong>High Power, High Interest:</strong> Manage closely</li>
      <li><strong>High Power, Low Interest:</strong> Keep satisfied</li>
      <li><strong>Low Power, High Interest:</strong> Keep informed</li>
      <li><strong>Low Power, Low Interest:</strong> Monitor</li>
    </ul>
    
    <h3>3. RACI Matrix</h3>
    <p>Define roles and responsibilities:</p>
    <ul>
      <li><strong>R</strong>esponsible: Who does the work</li>
      <li><strong>A</strong>ccountable: Who signs off</li>
      <li><strong>C</strong>onsulted: Who provides input</li>
      <li><strong>I</strong>nformed: Who needs updates</li>
    </ul>
    
    <blockquote>
      <p><strong>Remember:</strong> Stakeholder landscapes are dynamic. Review and update your analysis regularly throughout the project lifecycle.</p>
    </blockquote>`,
    packId: 'cbap-fundamentals',
  },
  
  {
    id: 'tip-requirements-elicitation',
    topicIds: ['elicitation', 'techniques'],
    title: 'Requirements Elicitation: Choosing the Right Technique',
    body: `<h2>Mastering Requirements Elicitation</h2>
    <p>The success of your project heavily depends on choosing the right elicitation techniques. Here's your guide:</p>
    
    <h3>Collaborative Techniques</h3>
    <h4>Workshops</h4>
    <ul>
      <li><strong>Best for:</strong> Complex problems, multiple stakeholders</li>
      <li><strong>Duration:</strong> 2-8 hours</li>
      <li><strong>Participants:</strong> 5-12 people</li>
      <li><strong>Tip:</strong> Always have a neutral facilitator</li>
    </ul>
    
    <h4>Focus Groups</h4>
    <ul>
      <li><strong>Best for:</strong> Understanding user needs and preferences</li>
      <li><strong>Size:</strong> 6-10 participants</li>
      <li><strong>Duration:</strong> 90-120 minutes</li>
    </ul>
    
    <h3>Research Techniques</h3>
    <h4>Document Analysis</h4>
    <ul>
      <li>Existing procedures and policies</li>
      <li>System documentation</li>
      <li>Compliance requirements</li>
      <li>Historical data and reports</li>
    </ul>
    
    <h4>Observation</h4>
    <ul>
      <li><strong>Passive:</strong> Watch without interference</li>
      <li><strong>Active:</strong> Ask questions during observation</li>
      <li><strong>Best for:</strong> Understanding current state processes</li>
    </ul>
    
    <h3>Interview Techniques</h3>
    <h4>Structured Interviews</h4>
    <ul>
      <li>Predetermined questions</li>
      <li>Consistent format</li>
      <li>Easy to compare responses</li>
    </ul>
    
    <h4>Unstructured Interviews</h4>
    <ul>
      <li>Open-ended conversation</li>
      <li>Exploratory in nature</li>
      <li>Uncover unexpected insights</li>
    </ul>
    
    <blockquote>
      <p><strong>Golden Rule:</strong> Use multiple elicitation techniques to validate and triangulate your findings. What people say, what they do, and what the documents say should align.</p>
    </blockquote>
    
    <h3>Quick Selection Guide</h3>
    <table>
      <tr><th>Scenario</th><th>Recommended Technique</th></tr>
      <tr><td>Complex business rules</td><td>Workshops + Document Analysis</td></tr>
      <tr><td>User experience requirements</td><td>Observation + Prototyping</td></tr>
      <tr><td>Strategic direction</td><td>Executive Interviews</td></tr>
      <tr><td>Technical constraints</td><td>Expert Interviews + Research</td></tr>
    </table>`,
    packId: 'cbap-fundamentals',
  },
  
  {
    id: 'tip-requirements-validation',
    topicIds: ['validation', 'techniques'],
    title: 'Requirements Validation: Ensuring Quality and Completeness',
    body: `<h2>Requirements Validation Best Practices</h2>
    <p>Validation ensures that requirements are correct, complete, and will solve the business problem. Here's how to do it effectively:</p>
    
    <h3>Validation Techniques</h3>
    
    <h4>1. Reviews and Walkthroughs</h4>
    <ul>
      <li><strong>Peer Reviews:</strong> Have colleagues examine requirements</li>
      <li><strong>Stakeholder Walkthroughs:</strong> Present requirements back to stakeholders</li>
      <li><strong>Formal Inspections:</strong> Structured review process with defined roles</li>
    </ul>
    
    <h4>2. Prototyping</h4>
    <ul>
      <li><strong>Low-fidelity:</strong> Paper sketches, wireframes</li>
      <li><strong>High-fidelity:</strong> Interactive mockups</li>
      <li><strong>Proof of Concept:</strong> Working implementation of key features</li>
    </ul>
    
    <h4>3. Acceptance Criteria Development</h4>
    <p>Use the <strong>Given-When-Then</strong> format:</p>
    <ul>
      <li><strong>Given:</strong> Initial context</li>
      <li><strong>When:</strong> Event or action</li>
      <li><strong>Then:</strong> Expected outcome</li>
    </ul>
    
    <h3>Quality Characteristics to Validate</h3>
    
    <h4>Correctness</h4>
    <ul>
      <li>Requirements accurately reflect stakeholder needs</li>
      <li>No conflicts between requirements</li>
      <li>Technically feasible</li>
    </ul>
    
    <h4>Completeness</h4>
    <ul>
      <li>All necessary requirements captured</li>
      <li>Functional and non-functional requirements</li>
      <li>Exception scenarios covered</li>
    </ul>
    
    <h4>Consistency</h4>
    <ul>
      <li>Terminology used consistently</li>
      <li>No contradictory requirements</li>
      <li>Aligned with business objectives</li>
    </ul>
    
    <h4>Testability</h4>
    <ul>
      <li>Clear success criteria</li>
      <li>Measurable outcomes</li>
      <li>Specific enough to create test cases</li>
    </ul>
    
    <blockquote>
      <p><strong>Validation Checklist:</strong> Can I test this? Does it solve the business problem? Is it technically feasible? Do stakeholders agree?</p>
    </blockquote>
    
    <h3>Common Validation Pitfalls</h3>
    <ol>
      <li><strong>Assuming understanding:</strong> Always confirm with stakeholders</li>
      <li><strong>Validating too late:</strong> Validate iteratively throughout the process</li>
      <li><strong>Focusing only on functional requirements:</strong> Don't forget quality attributes</li>
      <li><strong>Skipping negative scenarios:</strong> Test what shouldn't happen</li>
    </ol>`,
    packId: 'cbap-fundamentals',
  },
  
  {
    id: 'tip-solution-evaluation',
    topicIds: ['solution-evaluation', 'strategy'],
    title: 'Solution Evaluation Framework: Making Data-Driven Decisions',
    body: `<h2>Comprehensive Solution Evaluation</h2>
    <p>Evaluating solution options requires a structured approach to ensure the best business outcomes. Follow this framework:</p>
    
    <h3>1. Define Evaluation Criteria</h3>
    
    <h4>Financial Criteria</h4>
    <ul>
      <li><strong>Initial Investment:</strong> Development, licensing, infrastructure costs</li>
      <li><strong>Ongoing Costs:</strong> Maintenance, support, training</li>
      <li><strong>ROI Timeline:</strong> When will benefits outweigh costs?</li>
      <li><strong>Total Cost of Ownership (TCO):</strong> 3-5 year view</li>
    </ul>
    
    <h4>Technical Criteria</h4>
    <ul>
      <li><strong>Scalability:</strong> Can it grow with the business?</li>
      <li><strong>Integration:</strong> How well does it work with existing systems?</li>
      <li><strong>Security:</strong> Does it meet security requirements?</li>
      <li><strong>Performance:</strong> Response times, throughput</li>
    </ul>
    
    <h4>Business Criteria</h4>
    <ul>
      <li><strong>Strategic Alignment:</strong> Supports business objectives</li>
      <li><strong>Risk Level:</strong> Implementation and operational risks</li>
      <li><strong>Time to Market:</strong> How quickly can it be implemented?</li>
      <li><strong>Competitive Advantage:</strong> Unique business value</li>
    </ul>
    
    <h3>2. Scoring Matrix Approach</h3>
    
    <h4>Weighted Scoring Method</h4>
    <ol>
      <li>List all evaluation criteria</li>
      <li>Assign weights based on importance (total = 100%)</li>
      <li>Score each option (1-5 or 1-10 scale)</li>
      <li>Calculate weighted scores</li>
      <li>Compare total scores</li>
    </ol>
    
    <h4>Example Scoring Matrix</h4>
    <table>
      <tr><th>Criteria</th><th>Weight</th><th>Option A</th><th>Option B</th><th>Option C</th></tr>
      <tr><td>Cost</td><td>25%</td><td>7 (1.75)</td><td>5 (1.25)</td><td>9 (2.25)</td></tr>
      <tr><td>Technical Fit</td><td>30%</td><td>8 (2.40)</td><td>9 (2.70)</td><td>6 (1.80)</td></tr>
      <tr><td>Risk</td><td>20%</td><td>6 (1.20)</td><td>8 (1.60)</td><td>7 (1.40)</td></tr>
      <tr><td>Strategic Value</td><td>25%</td><td>9 (2.25)</td><td>7 (1.75)</td><td>8 (2.00)</td></tr>
      <tr><td><strong>Total</strong></td><td><strong>100%</strong></td><td><strong>7.60</strong></td><td><strong>7.30</strong></td><td><strong>7.45</strong></td></tr>
    </table>
    
    <h3>3. Risk Assessment</h3>
    
    <h4>Implementation Risks</h4>
    <ul>
      <li>Technology complexity</li>
      <li>Resource availability</li>
      <li>Change management challenges</li>
      <li>Integration complexity</li>
    </ul>
    
    <h4>Business Risks</h4>
    <ul>
      <li>Market changes</li>
      <li>Regulatory changes</li>
      <li>Vendor stability</li>
      <li>Competitive response</li>
    </ul>
    
    <h3>4. Recommendation Framework</h3>
    
    <blockquote>
      <p><strong>Best Practice:</strong> Present 2-3 viable options with clear trade-offs. Never present just one option unless it's truly the only viable choice.</p>
    </blockquote>
    
    <h4>Recommendation Structure</h4>
    <ol>
      <li><strong>Executive Summary:</strong> Key recommendation and rationale</li>
      <li><strong>Evaluation Process:</strong> Criteria and methodology</li>
      <li><strong>Option Comparison:</strong> Detailed scoring and analysis</li>
      <li><strong>Implementation Considerations:</strong> Timeline, resources, risks</li>
      <li><strong>Next Steps:</strong> Immediate actions required</li>
    </ol>
    
    <h3>Decision Validation Questions</h3>
    <ul>
      <li>Does this solution align with our strategic objectives?</li>
      <li>Do we have the capabilities to implement it successfully?</li>
      <li>What are the consequences of not implementing this solution?</li>
      <li>How will we measure success?</li>
      <li>What's our fallback plan if this doesn't work?</li>
    </ul>`,
    packId: 'cbap-fundamentals',
  }
];

// Helper function to add sample tips to database
export const insertSampleTips = async (_tipRepository: any): Promise<void> => {
  try {
    // In a real implementation, you'd have a method to insert tips
    // This is just for demonstration
    console.log('Sample tips to be inserted:', sampleTips.length);
    
    // For now, just log the tips since we need the actual repository implementation
    sampleTips.forEach(tip => {
      console.log(`Sample tip: ${tip.title}`);
    });
  } catch (error) {
    console.error('Error inserting sample tips:', error);
  }
};