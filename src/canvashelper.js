require('dotenv').config()

/**
 * Assists with storing User's Canvas information
 * @author Mari Garey
 */
class CanvasHelper {

    url // canvas site url
    api // canvas api key
    user // user canvas id
    courses // list of current courses

    constructor() {
        this.url = process.env.CANVAS_API_URL
        this.api = process.env.CANVAS_API
        // this.user = this.getUserId()
        this.courses = this.getCourses()
    }

    set url(url) {
        this.url = url
    }

    get url() {
        return this.url
    }

    set api(api) {
        this.api = api
    }

    get api() {
        return this.api
    }

    // set user(user) {
    //     this.user = user
    // }

    // get user() {
    //     return this.user
    // }

    set courses(courses) {
        this.courses = courses
    }

    get courses() {
        return this.courses
    }

    /**
     * Gets user id from internal CanvasAPI
     * @returns {number}
     */
    async getUserId() {
        // Connect to CanvasAPI
        const domain = `${this.url}/api/v1/courses?access_token=${this.api}`
        const response = await fetch(domain)
        const courses = await response.json()
        console.log(courses)

        // Access first availible Course
        const course_option = await courses.filter(course => typeof course.name !== 'undefined')

        // returns the user id
        return await course_option[0]["enrollments"][0]["user_id"]
    }

    /**
     * Retrieves the user's courses
     * 
     * @returns {Promise<Array<{id: string, name: string}}
     */
    async getCourses() {
        // Canvas API connection
        const domain = `${this.url}/api/v1/courses?access_token=${this.api}&per_page=100&enrollment_state=active`
        const response = await fetch(domain)
        const courses = await response.json()

        // Convert each course for API format, only courses that are currently active
        const courseList = await courses
            // .filter(course => typeof course.name !== 'undefined' && (course.end_at ? course.end_at > new Date().toJSON(): true))
            .map(course => ({
                id: course.id.toString(),
                name: course.name
            }))

        // list of the active courses
        return await courseList
    }

    /**
     * Retrieves the assignments from the Canvas API for a specific course.
     * 
     * @param {string} courseID 
     * @param {string} courseName 
     * @returns {Promise<Array<{ name: string, date: string, course: string, ID: string }>>}
     */
    async getCourseAssignments(courseID, courseName) {
        // Canvas API connection
        const url = `${this.url}/api/v1/courses/${courseID}/assignments?access_token=${this.api}&per_page=100`
        const response = await fetch(url)
        const assignments = await response.json()
        //console.log(await assignments)

        // Convert each assignment for the API, only for assignments that are named
        const assignment_list = await assignments
        .filter(assignment => typeof assignment.name !== 'undefined' && typeof assignment.due_at !== 'undefined' && assignment.due_at >= new Date().toJSON())
        .map((assignment) =>
            ({
                "Assignment Name": {
                    type: "title",
                    title: [{
                        type: "text",
                        text: { content: assignment.name }
                    }]
                },
                "Due Date": {
                    type: "date",
                    date: { start: assignment.due_at}
                },
                "Course": {
                    select: {
                        name: courseName
                    }
                },
                "URL": {
                    type: "url",
                    url: assignment.html_url
                },
                "ID": {
                    type: "number",
                    number: assignment.id,
                },
            }
        ))

        // list of assignments for the course
        return await assignment_list 
    }

    /**
     * Retrieves the discussions from the Canvas API for a specific course.
     * 
     * @param {string} courseID 
     * @param {string} courseName 
     * @returns {Promise<Array<{ name: string, date: string, course: string, ID: string }>>}
     */
    async getCourseDiscussions(courseID, courseName) {
        const url = `${this.url}/api/v1/courses/${courseID}/discussion_topics?access_token=${this.api}`
        const response = await fetch(url)
        const discussion_topics = await response.json()

        // Convert each discussion for the API, only for assignments that are named
        const discussion_list = await discussion_topics
        .filter(discussion => typeof discussion.title !== 'undefined')
        .map((discussion) =>
            ({
                "Assignment Name": {
                    type: "title",
                    title: [{
                        type: "text",
                        text: { content: discussion.title }
                    }]
                },
                "Due Date": {
                    type: "date",
                    date: { 
                        start: discussion.delayed_post_at,
                        end: discussion.lock_at,
                    }
                },
                "Course": {
                    select: {
                        name: courseName
                    }
                },
                "URL": {
                    type: "url",
                    url: discussion.html_url
                },
                "ID": {
                    type: "number",
                    number: discussion.id,
                },
            }
        ))

        // list of dicussion for the course
        return await discussion_list
    }
}

module.exports = { CanvasHelper }
