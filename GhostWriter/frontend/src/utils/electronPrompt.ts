
// Fallback for when electron-prompt isn't available
const browserPrompt = (message: string): Promise<string | null> => {
  return new Promise((resolve) => {
    // Use a simple input dialog created with HTML
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                  background: rgba(0,0,0,0.5); z-index: 9999; display: flex; 
                  align-items: center; justify-content: center;">
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
          <h3>${message}</h3>
          <input type="text" id="promptInput" style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px;">
          <div style="text-align: right; margin-top: 15px;">
            <button id="promptCancel" style="margin-right: 10px; padding: 8px 16px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
            <button id="promptOk" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector('#promptInput') as HTMLInputElement;
    const okBtn = modal.querySelector('#promptOk') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#promptCancel') as HTMLButtonElement;

    input.focus();

    const cleanup = () => {
      document.body.removeChild(modal);
    };

    okBtn.onclick = () => {
      resolve(input.value || null);
      cleanup();
    };

    cancelBtn.onclick = () => {
      resolve(null);
      cleanup();
    };

    input.onkeypress = (e) => {
      if (e.key === 'Enter') {
        resolve(input.value || null);
        cleanup();
      } else if (e.key === 'Escape') {
        resolve(null);
        cleanup();
      }
    };
  });
};

export const electronPrompt = browserPrompt;
