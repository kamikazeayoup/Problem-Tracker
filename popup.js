document.addEventListener('DOMContentLoaded', function() {
    // Load existing problems
    loadProblems();
    
    // Add event listeners
    document.getElementById('add-problem').addEventListener('click', addProblem);
    document.getElementById('get-daily-problem').addEventListener('click', getDailyProblem);
    
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Show the selected tab content
        const tabName = this.getAttribute('data-tab');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Refresh problem list when switching to the list tab
        if (tabName === 'list') {
          loadProblems();
        }
      });
    });
  });
  
  // Function to extract problem name from URL
  function extractProblemName(url) {
    try {
      const urlObj = new URL(url);
      
      // For LeetCode URLs
      if (urlObj.hostname.includes('leetcode.com') && urlObj.pathname.includes('/problems/')) {
        // Extract the problem slug (e.g., "merge-sorted-array")
        const pathParts = urlObj.pathname.split('/');
        const problemIndex = pathParts.findIndex(part => part === 'problems');
        
        if (problemIndex !== -1 && problemIndex + 1 < pathParts.length) {
          const problemSlug = pathParts[problemIndex + 1];
          // Convert slug to proper title case
          return problemSlug.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
      
      // For other platforms, can add similar extraction logic here
      
      return 'Unknown Problem';
    } catch (e) {
      return 'Invalid URL';
    }
  }
  
  // Add event listener for problem link input
  document.addEventListener('DOMContentLoaded', function() {
    const problemLinkInput = document.getElementById('problem-link');
    problemLinkInput.addEventListener('blur', function() {
      // Only auto-extract if the problem name field is empty
      if (!document.getElementById('problem-name').value) {
        const problemName = extractProblemName(this.value);
        document.getElementById('problem-name').value = problemName;
      }
    });
    
    // Set today's date as default for the solving date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('solving-date').value = today;
  });
  
  // Function to show snackbar
  function showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.className = "snackbar show";
    
    // After 3 seconds, remove the show class
    setTimeout(function(){ 
      snackbar.className = snackbar.className.replace("show", ""); 
    }, 3000);
  }
  
  function addProblem() {
    const problemLink = document.getElementById('problem-link').value;
    if (!problemLink) {
      showSnackbar('Please enter a problem link.');
      return;
    }
    
    const problemName = document.getElementById('problem-name').value;
    const solvedByYourself = document.getElementById('solved-by-yourself').value === 'true';
    const timesSolved = parseInt(document.getElementById('times-solved').value) || 0;
    const solvingDate = document.getElementById('solving-date').value;
    
    // Get existing problems
    chrome.storage.local.get(['problems'], function(result) {
      const problems = result.problems || [];
      
      // Check if problem already exists
      const existingProblemIndex = problems.findIndex(p => p.link === problemLink);
      
      if (existingProblemIndex !== -1) {
        // Update existing problem
        problems[existingProblemIndex].name = problemName;
        problems[existingProblemIndex].solvedByYourself = solvedByYourself;
        problems[existingProblemIndex].timesSolved = timesSolved;
        problems[existingProblemIndex].solvingDate = solvingDate;
      } else {
        // Add new problem
        problems.push({
          link: problemLink,
          name: problemName,
          solvedByYourself: solvedByYourself,
          timesSolved: timesSolved,
          solvingDate: solvingDate,
          dateAdded: new Date().toISOString(),
          lastRevised: null
        });
      }
      
      // Save updated problems
      chrome.storage.local.set({ problems: problems }, function() {
        document.getElementById('problem-link').value = '';
        document.getElementById('problem-name').value = '';
        document.getElementById('solved-by-yourself').value = 'true';
        document.getElementById('times-solved').value = '1';
        
        // Keep today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('solving-date').value = today;
        
        // Show snackbar instead of alert
        showSnackbar('Problem added successfully!');
      });
    });
  }
  
  function loadProblems() {
    const problemListContainer = document.getElementById('problem-list-container');
    
    chrome.storage.local.get(['problems'], function(result) {
      const problems = result.problems || [];
      
      if (problems.length === 0) {
        problemListContainer.innerHTML = '<div class="problem-item">No problems added yet.</div>';
        return;
      }
      
      // Clear existing problems
      problemListContainer.innerHTML = '';
      
      // Add each problem to the list
      problems.forEach((problem, index) => {
        const problemItem = document.createElement('div');
        problemItem.className = 'problem-item';
        
        // Extract domain name for display
        let displayLink = problem.link;
        try {
          const url = new URL(problem.link);
          displayLink = url.hostname + url.pathname;
        } catch (e) {
          // If not a valid URL, use as is
        }
        
        problemItem.innerHTML = `
          <div class="flex">
            <a href="${problem.link}" class="problem-link" target="_blank">${problem.name || displayLink}</a>
            <button class="delete-btn" data-index="${index}">Delete</button>
          </div>
          <div class="problem-info">
            <span>Solved by yourself: ${problem.solvedByYourself ? 'Yes' : 'No'}</span>
            <span>Times solved: ${problem.timesSolved}</span>
            ${problem.solvingDate ? `<span>Solving date: ${problem.solvingDate}</span>` : ''}
          </div>
        `;
        
        problemListContainer.appendChild(problemItem);
      });
      
      // Add delete event listeners
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const index = parseInt(this.getAttribute('data-index'));
          deleteProblems(index);
        });
      });
    });
  }
  
  function deleteProblems(index) {
    chrome.storage.local.get(['problems'], function(result) {
      const problems = result.problems || [];
      
      if (index >= 0 && index < problems.length) {
        problems.splice(index, 1);
        
        chrome.storage.local.set({ problems: problems }, function() {
          loadProblems();
          // Show snackbar instead of alert
          showSnackbar('Problem deleted successfully!');
        });
      }
    });
  }
  
  function getDailyProblem() {
    chrome.storage.local.get(['problems', 'lastDailyProblem'], function(result) {
      const problems = result.problems || [];
      
      if (problems.length === 0) {
        showSnackbar('No problems added yet. Add some problems first!');
        return;
      }
      
      // Filter out the last problem given (if any) to avoid immediate repetition
      let availableProblems = problems;
      if (result.lastDailyProblem) {
        availableProblems = problems.filter(p => p.link !== result.lastDailyProblem);
        
        // If all problems have been given, reset
        if (availableProblems.length === 0) {
          availableProblems = problems;
        }
      }
      
      // Assign weights/priorities to each problem
      const weightedProblems = availableProblems.map(problem => {
        let weight = 100;
        
        // Reduce weight if solved by yourself
        if (problem.solvedByYourself) {
          weight -= 30;
        }
        
        // Reduce weight based on times solved (more times = lower priority)
        weight -= Math.min(problem.timesSolved * 10, 50);
        
        // Ensure weight is at least 1
        weight = Math.max(weight, 1);
        
        return {
          problem: problem,
          weight: weight
        };
      });
      
      // Total weight
      const totalWeight = weightedProblems.reduce((sum, wp) => sum + wp.weight, 0);
      
      // Random selection based on weights
      let random = Math.random() * totalWeight;
      let selectedProblem = null;
      
      for (const wp of weightedProblems) {
        random -= wp.weight;
        if (random <= 0) {
          selectedProblem = wp.problem;
          break;
        }
      }
      
      // If something went wrong, just pick a random one
      if (!selectedProblem && availableProblems.length > 0) {
        selectedProblem = availableProblems[Math.floor(Math.random() * availableProblems.length)];
      }
      
      // Display the selected problem
      const dailyProblemContainer = document.getElementById('daily-problem-container');
      const dailyProblemContent = document.getElementById('daily-problem-content');
      
      if (selectedProblem) {
        // Extract domain name for display
        let displayLink = selectedProblem.link;
        try {
          const url = new URL(selectedProblem.link);
          displayLink = url.hostname + url.pathname;
        } catch (e) {
          // If not a valid URL, use as is
        }
        
        dailyProblemContent.innerHTML = `
          <a href="${selectedProblem.link}" class="problem-link" target="_blank">${selectedProblem.name || displayLink}</a>
          <div class="problem-info">
            <span>Solved by yourself: ${selectedProblem.solvedByYourself ? 'Yes' : 'No'}</span>
            <span>Times solved: ${selectedProblem.timesSolved}</span>
            ${selectedProblem.solvingDate ? `<span>Last solved: ${selectedProblem.solvingDate}</span>` : ''}
          </div>
          <button id="mark-solved" style="margin-top: 10px;">Mark as Solved</button>
        `;
        
        dailyProblemContainer.style.display = 'block';
        
        // Add event listener for the Mark as Solved button
        document.getElementById('mark-solved').addEventListener('click', function() {
          markProblemAsSolved(selectedProblem.link);
        });
        
        // Save last given problem
        chrome.storage.local.set({ lastDailyProblem: selectedProblem.link });
      } else {
        dailyProblemContent.innerHTML = 'No problems available.';
        dailyProblemContainer.style.display = 'block';
      }
    });
  }
  
  function markProblemAsSolved(problemLink) {
    chrome.storage.local.get(['problems'], function(result) {
      const problems = result.problems || [];
      
      const problemIndex = problems.findIndex(p => p.link === problemLink);
      
      if (problemIndex !== -1) {
        // Increment times solved
        problems[problemIndex].timesSolved += 1;
        problems[problemIndex].lastRevised = new Date().toISOString();
        
        // Update solving date to today
        const today = new Date().toISOString().split('T')[0];
        problems[problemIndex].solvingDate = today;
        
        chrome.storage.local.set({ problems: problems }, function() {
          // Show snackbar instead of alert
          showSnackbar('Problem marked as solved!');
          
          // Refresh daily problem
          getDailyProblem();
        });
      }
    });
  }
  