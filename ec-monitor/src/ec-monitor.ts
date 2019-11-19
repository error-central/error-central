import * as fs from "fs";
import * as path from "path";
import * as tail from "tail";
import * as os from "os";
import axios from "axios";
import EventEmitter = require("events");

/**
 * Interface/spec for recording details of an error
 */
interface IFoundError {
  sessionId?: string; // Optional identifier for terminal/session
  blobId?: number; // Id of the individual blob containing error
  date?: Date; // When this error was detected
  language?: string; // Language error was found in
  rawText: string; // Entire blob of error message
  title: string; // Best title to show
  googleQs?: Array<string>; // HACK: Queries to pass to google
}

/**
 * Class for monitoring the log files written by our tee hack.
 */
class ErrorCentralMonitor extends EventEmitter {

  // Directory where ec tail logs files all written
  private _errlogPath: string = path.join(os.homedir(), ".ec", "sessions");
  // Known file paths that we're tailing
  private _filesBeingTailed: { [path: string]: tail.Tail } = {};
  private _tailFilePollIntervalMs = 2000;
  private _blobCounter = 0;

  public constructor() {
    super();

    // Check for newly created terminals every so often
    setInterval(() => this.checkForErrlogs(), this._tailFilePollIntervalMs);
  }

  /**
   * Scan all the logs we're tracking and see if they contain new errors
   * TODO: Delete or ignore old logs
   */
  public checkForErrlogs() {
    fs.readdir(this._errlogPath, (err, files) => {
      if (err) {
        return console.error(`Unable to scan ec directory: ${err}`);
      }
      files.forEach(file => {
        const filePath = path.join(this._errlogPath, file);
        const alreadyFollowed = (filePath in this._filesBeingTailed);
        let processExists;
        try {
          // Passing '0' means it will throw an error if process doesn't exist.
          process.kill(parseInt(file), 0);
          processExists = true;
        }
        catch (err) {
          console.log(`Deleting dead session ${filePath}`);
          fs.unlink(filePath, e => console.log);
          processExists = false;
        }

        if (!alreadyFollowed && processExists) {
          const options = {
            separator: null,
            follow: true,
            flushAtEOF: true,
            useWatchFile: true,
          };

          try {
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
      foundError.date = new Date();

      // Emit event for anyone listening
      this.emit("errorFound", foundError);
    }
  }

  /**
   * Return error info if one found in passed string, else null
   * @param data String in which to search for errors
   */
  public extractError(data: string): IFoundError | null {
    // Patterns for error messages
    const errorDetectors = [
      this.findPythonError,
      this.findNodeError,
      this.findBashError,
      this.findGitError];
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

  //
  // ** Paterns for errors **
  //

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

  public findNpmError(data: string): IFoundError | null {
    // TODO: we probably need to strip control codes, as `ERR!` is colorized.
    const regex = /^npm ERR!*/gms;
    if (!regex.test(data)) {
      return null; // No error found in data, we're done!
    }
    const title = data.trim().split("\n")[0] || "";
    const result: IFoundError = {
      language: "npm",
      rawText: data,
      title,
      googleQs: [title]
    };
    return result;
  }


  public findBashError(data: string): IFoundError | null {
    const regex = /^-?bash: */gms;
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
}



function postToCloud(foundError: IFoundError) {
  // Post to cloud
  axios.post("http://wanderingstan.com/ec/ec-monitor.php", {
    "sessionId": foundError.sessionId,
    "userName": os.userInfo().username,
    "blobId": foundError.blobId,
    "date": foundError.date ? foundError.date.toJSON() : null,
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

if (require.main === module) {
  // This module was run directly from the command line as in node xxx.js

  // Test if ec-monitor is already running, by looking in our magic file.
  // File is expected to contain the pid of last run ec-monitor process.
  const pidFile = path.join(os.homedir(), ".ec", "ec-monitor-pid.txt");
  if (fs.existsSync(pidFile)) {
    const ecMonitorPid = parseInt(fs.readFileSync(pidFile, "utf8"));
    try {
      // Passing '0' means it will throw an error if process doesn't exist.
      process.kill(ecMonitorPid, 0);
      // ec-monitor already running, so we exit
      console.log(`🐛 ec-monitor: Existed with pid ${ecMonitorPid}`);
      process.exit();
    }
    catch (err) {
      // File pid no longer running. Therefore we allow this process to continue.
    }
  }
  // Record our pid as *the* running ec-monitor
  fs.writeFileSync(pidFile, process.pid);

  let ecm = new ErrorCentralMonitor();

  ecm.on("errorFound", (foundError) => {
    postToCloud(foundError);
  });

  console.log(`🐛 ec-monitor: Launched with pid ${process.pid}`);
}

module.exports = ErrorCentralMonitor;
