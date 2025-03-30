document.addEventListener('DOMContentLoaded', function() {

  chrome.storage.local.get(['dailyStreak', 'lastSolvedDate', 'currentDailyProblem'], function(result) {
    const currentDate = new Date().toISOString().split('T')[0];
    const lastSolvedDate = result.lastSolvedDate;
    const dailyStreak = result.dailyStreak || 0;

    const dailyProblemContainer = document.getElementById('daily-problem-container');
    const dailyProblemContent = document.getElementById('daily-problem-content');

    // Check if today's problem is solved
    if (lastSolvedDate === currentDate) {
      // Show streak message
      dailyProblemContent.innerHTML = `
        <div class="problem-item">
          <h3>Streak Celebration!</h3>
          <div class="problem-info">
            <p>${getStreakMessage(dailyStreak)}</p>
          </div>
        </div>
      `;
      dailyProblemContainer.style.display = 'block';
    } else if (result.currentDailyProblem) {
      // If there's a current daily problem and not solved today, show the problem
      getDailyProblem();
    } else {
      // No problem for today, get a new one
      getDailyProblem();
    }
  });

    // Load existing problems
    loadProblems();
    
    // Add event listeners
    document.getElementById('add-problem').addEventListener('click', addProblem);
    document.getElementById('get-daily-problem').addEventListener('click', function() {
        getDailyProblem(true); // Force new problem selection
      });    
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
  
  function getStreakMessage(dailyStreak) {
  if (dailyStreak === 1) {
    return "🚀 You've started your daily coding streak! Keep it up!";
  } else if (dailyStreak === 7) {
    return "🔥 1 week of consistent solving. You're awesome!";
  } else if (dailyStreak === 30) {
    return "🏆 30 days of continuous learning! You're a coding champion!";
  }
  return `Great job! You're on a ${dailyStreak} day solving streak!`;
}
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
  
  function getDailyProblem(forceNew = false) {
    chrome.storage.local.get(['problems', 'currentDailyProblem'], function(result) {
      const problems = result.problems || [];
      
      if (problems.length === 0) {
        showSnackbar('No problems added yet. Add some problems first!');
        return;
      }
      
      let selectedProblem = null;
      
      // If not forcing new and a current daily problem exists, use it
      if (!forceNew && result.currentDailyProblem) {
        selectedProblem = problems.find(p => p.link === result.currentDailyProblem);
      }
      
      // If no current problem or forcing new, select a new problem
      if (!selectedProblem) {
        // Weighted random selection logic
        const weightedProblems = problems.map(problem => {
          let weight = 100;
          
          if (problem.solvedByYourself) {
            weight -= 30;
          }
          
          weight -= Math.min(problem.timesSolved * 10, 50);
          weight = Math.max(weight, 1);
          
          return { problem, weight };
        });
        
        const totalWeight = weightedProblems.reduce((sum, wp) => sum + wp.weight, 0);
        
        let random = Math.random() * totalWeight;
        for (const wp of weightedProblems) {
          random -= wp.weight;
          if (random <= 0) {
            selectedProblem = wp.problem;
            break;
          }
        }
      }
      
      // Display the problem
      const dailyProblemContainer = document.getElementById('daily-problem-container');
      const dailyProblemContent = document.getElementById('daily-problem-content');
      
      if (selectedProblem) {
        dailyProblemContent.innerHTML = `
          <a href="${selectedProblem.link}" class="problem-link" target="_blank">${selectedProblem.name}</a>
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
        
        // Save the current daily problem only if it's a new selection
        if (forceNew || !result.currentDailyProblem) {
          chrome.storage.local.set({ 
            currentDailyProblem: selectedProblem.link 
          });
        }
      } else {
        dailyProblemContent.innerHTML = 'No problems available.';
        dailyProblemContainer.style.display = 'block';
      }
    });
  }  
  
  function markProblemAsSolved(problemLink) {
    chrome.storage.local.get(['problems', 'dailyStreak', 'lastSolvedDate'], function(result) {
      const problems = result.problems || [];
      const currentDate = new Date().toISOString().split('T')[0];
      let dailyStreak = result.dailyStreak || 0;
      let lastSolvedDate = result.lastSolvedDate || null;
  
      const problemIndex = problems.findIndex(p => p.link === problemLink);
      
      if (problemIndex !== -1) {
        problems[problemIndex].timesSolved += 1;
        problems[problemIndex].lastRevised = new Date().toISOString();
        
        problems[problemIndex].solvingDate = currentDate;
        problems[problemIndex].solvedByYourself = true;
        
        // Streak Logic
        if (lastSolvedDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const lastSolved = new Date(lastSolvedDate);
  
          if (
            lastSolved.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]
          ) {
            dailyStreak += 1;
          } else if (lastSolved.toISOString().split('T')[0] !== currentDate) {
            dailyStreak = 1;
          }
        } else {
          dailyStreak = 1;
        }
  
        chrome.storage.local.set({ 
          problems: problems,
          currentDailyProblem: null,
          dailyStreak: dailyStreak,
          lastSolvedDate: currentDate
        }, function() {
          const streakMessage = getStreakMessage(dailyStreak);
  
          // Clear daily problem container
          const dailyProblemContainer = document.getElementById('daily-problem-container');
          const dailyProblemContent = document.getElementById('daily-problem-content');
          
          dailyProblemContent.innerHTML = `
            <div class="problem-item">
              <h3>Problem Solved!</h3>
              <div class="problem-info">
                <p>${streakMessage}</p>
              </div>
            </div>
          `;
          dailyProblemContainer.style.display = 'block';
  
          showSnackbar(`Problem marked as solved! ${streakMessage}`);
        });
      }
    });
  }
  