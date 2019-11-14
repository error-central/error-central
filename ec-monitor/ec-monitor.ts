import * as fs from "fs";
import * as path from "path";
import * as tail from "tail";
import * as os from "os";
import axios from "axios";

interface IFoundError {
  sessionId?: string; // Optional identifier for terminal/session
  blobId?: number; // Id of the individual blob containing error
  language?: string; // Language error was found in
  rawText: string; // Entire blob of error message
  title: string; // Best title to show
  googleQs?: Array<string>; // HACK: Queries to pass to google
}

class ErrorCentralMonitor {

  // Directory where ec tail logs files all written
  private _errlogPath: string = path.join(os.homedir(), ".ec", "sessions");
  // Known file paths that we're tailing
  private _filesBeingTailed: { [path: string]: tail.Tail } = {};
  private _tailFilePollIntervalMs = 2000;
  private _blobCounter = 0;

  public constructor() {
    setInterval(() => this.checkForErrlogs(), this._tailFilePollIntervalMs);
  }

  /**
   * Look for errors in newly added data blob
   *
   * @param data New data that was just added to file
   * @param filePath File where new data was found
   */
  private _handleBlob(data: any, filePath: string) {
    if (data.length == 1) return; // Skip single char; just user typing in bash

    // TODO: Make these unique across multiple sessions
    const ourBlobId = this._blobCounter;
    this._blobCounter += 1;

    let foundError = this.extractError(data);
    if (foundError) {
      // Pass to webview
      foundError.sessionId = filePath;
      foundError.blobId = ourBlobId;

      // Post to cloud
      axios.post("http://wanderingstan.com/ec/ec-monitor.php", {
        "sessionId": foundError.sessionId,
        "userName": os.userInfo().username,
        "blobId": foundError.blobId,
        "language": foundError.language,
        "title": foundError.title,
        "rawText": foundError.rawText,
      })
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });

    }
  }

  /**
   * Return error info if one found in passed string, else null
   * @param data String in which to search for errors
   */
  public extractError(data: string): IFoundError | null {
    // Patterns for error messages
    const errorDetectors = [this.findPythonError, this.findNodeError, this.findBashError, this.findGitError];
    for (const detector of errorDetectors) {
      const foundError = detector(data);
      if (foundError) {
        console.info(`🔵 foundError → `, foundError);
        return foundError;
      }
    }
    // No errors found
    return null;
  }

  public findNodeError(data: string): IFoundError | null {
    const regex = /Thrown:.*\n[a-zA-Z0-9]*:.*/gms;
    if (!regex.test(data)) {
      return null; // No error found in data, we're done!
    }

    // Last line is title
    const title =
      data
        .trim()
        .split("\n")
        .pop() || "";

    const result: IFoundError = {
      language: "node",
      rawText: data,
      title,
      googleQs: [title]
    };
    return result;
  }

  public findGitError(data: string): IFoundError | null {
    const regex = /^remote: */gms;
    if (!regex.test(data)) {
      return null; // No error found in data, we're done!
    }
    const title = data.trim().split("\n")[0] || "";
    const result: IFoundError = {
      language: "git",
      rawText: data,
      title,
      googleQs: [title]
    };
    return result;
  }

  public findBashError(data: string): IFoundError | null {
    const regex = /^bash: */gms;
    if (!regex.test(data)) {
      return null; // No error found in data, we're done!
    }
    const title = data.trim().split("\n")[0] || "";
    const result: IFoundError = {
      language: "bash",
      rawText: data,
      title,
      googleQs: [title]
    };
    return result;
  }

  public findPythonError(data: string): IFoundError | null {
    const regex = /File "[^"]*",.*\n[a-zA-Z0-9]*:.*/gms;
    if (!regex.test(data)) {
      return null; // No error found in data, we're done!
    }

    // Last line is title
    const title =
      data
        .trim()
        .split("\n")
        .pop() || "";
    // Brute force take out things that look like variables in error output
    const strippedQ = title.replace(/'.*'/, "");

    const result: IFoundError = {
      language: "python",
      rawText: data,
      title,
      googleQs: [title, strippedQ]
    };
    return result;
  }


  /**
   * Scan all the logs we're tracking and see if they contain new errors
   */
  public checkForErrlogs() {
    fs.readdir(this._errlogPath, (err, files) => {
      if (err) {
        return console.error(`Unable to scan ec directory: ${err}`);
      }
      files.forEach(file => {
        const filePath = path.join(this._errlogPath, file);
        if (filePath in this._filesBeingTailed === false) {
          const options = {
            separator: null,
            follow: true,
            flushAtEOF: true,
            useWatchFile: true,
          };

          try {
            // TODO: We should pass any existing filedata to webview at this point,
            //       i.e. data that was there before we started tailing.
            let t = new tail.Tail(filePath, options);
            t.on("line", data => this._handleBlob(data, filePath));
            this._filesBeingTailed[filePath] = t;
            console.log(`Now tailing "${filePath}"`);
          } catch (error) {
            console.error("tail error:", error);
          }
        }
      });
    });
  }

}


let x = new ErrorCentralMonitor()
console.log("Running!");
