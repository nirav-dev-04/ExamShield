-- V10__java_python_os_cn_js_questions.sql
-- Clean up existing data to avoid conflicts with new structure
DELETE FROM attempt_questions;
DELETE FROM exam_question_pool;
DELETE FROM questions;

-- Seed topics for Java, Python, OS, CN, JS
INSERT INTO topics (name) VALUES ('Java') ON CONFLICT (name) DO NOTHING;
INSERT INTO topics (name) VALUES ('Python') ON CONFLICT (name) DO NOTHING;
INSERT INTO topics (name) VALUES ('Operating Systems') ON CONFLICT (name) DO NOTHING;
INSERT INTO topics (name) VALUES ('Computer Networks') ON CONFLICT (name) DO NOTHING;
INSERT INTO topics (name) VALUES ('JavaScript') ON CONFLICT (name) DO NOTHING;

-- Seed 20 questions for Java
INSERT INTO questions (topic_id, type, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, marks, created_by)
VALUES
((SELECT id FROM topics WHERE name = 'Java'), 'MCQ', 'Which JVM memory area stores local variables during method execution?', 'Method Area', 'Heap', 'Stack', 'JVM Register', 'C', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'MCQ', 'Which class is the root of the class hierarchy in the Java Programming Language?', 'String', 'Object', 'Class', 'System', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'TRUE_FALSE', 'Java bytecode can be run on any platform that has a Java Virtual Machine (JVM).', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'MCQ', 'What happens when a class is declared as final in Java?', 'It cannot be instantiated', 'It cannot be inherited/subclassed', 'It cannot contain any static methods', 'It must be declared as abstract', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'SUBJECTIVE', 'Explain how Garbage Collection works in Java and describe the role of the System.gc() method.', NULL, NULL, NULL, NULL, NULL, 'MEDIUM', 5, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'MCQ', 'Which method is used to transition a Java Thread into the runnable state?', 'run()', 'start()', 'sleep()', 'wait()', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'MCQ', 'Which of the following is a checked exception in Java?', 'NullPointerException', 'ArithmeticException', 'IOException', 'ArrayIndexOutOfBoundsException', 'C', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'TRUE_FALSE', 'A static method in Java can access non-static instance variables directly.', 'TRUE', 'FALSE', NULL, NULL, 'FALSE', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'SUBJECTIVE', 'Explain the key differences between an Interface and an Abstract Class in Java 8 and subsequent versions.', NULL, NULL, NULL, NULL, NULL, 'HARD', 10, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'MCQ', 'What is the output of: String s1 = "Java"; String s2 = new String("Java"); System.out.println(s1 == s2);?', 'true', 'false', 'Compile Error', 'NullPointerException', 'B', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'MCQ', 'What is the average time complexity of get() and put() operations in a HashMap?', 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'A', 'MEDIUM', 3, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'TRUE_FALSE', 'Autoboxing is the automatic conversion that the Java compiler makes between the primitive types and their corresponding object wrapper classes.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'SUBJECTIVE', 'Compare ArrayList and LinkedList in Java in terms of memory utilization and performance of random access versus element insertion.', NULL, NULL, NULL, NULL, NULL, 'MEDIUM', 5, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'MCQ', 'What is the output format of the Java compiler (javac)?', 'Native Machine Code', 'Bytecode (.class)', 'Assembly Code', 'Compressed Source (.jar)', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'MCQ', 'Which keyword is used to call a superclass constructor from a subclass constructor in Java?', 'this', 'super', 'parent', 'base', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'TRUE_FALSE', 'Java supports multiple inheritance of classes.', 'TRUE', 'FALSE', NULL, NULL, 'FALSE', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'MCQ', 'Which interface must a class implement to be used in a try-with-resources statement?', 'Runnable', 'Cloneable', 'AutoCloseable', 'Serializable', 'C', 'HARD', 3, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'SUBJECTIVE', 'Describe the purpose of the ''volatile'' keyword in Java multithreading and how it relates to thread memory visibility.', NULL, NULL, NULL, NULL, NULL, 'HARD', 5, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'MCQ', 'What happens to Java Generic type parameters during compilation?', 'They are replaced by Object or bounds via Type Erasure', 'They are preserved in the compiled bytecode', 'They cause compile-time errors', 'They are converted to dynamic pointers', 'A', 'HARD', 5, 1),
((SELECT id FROM topics WHERE name = 'Java'), 'TRUE_FALSE', 'Method overloading in Java is resolved at compile-time, whereas method overriding is resolved at runtime.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'MEDIUM', 2, 1);

-- Seed 20 questions for Python
INSERT INTO questions (topic_id, type, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, marks, created_by)
VALUES
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'Which keyword is used to define a function in Python?', 'func', 'define', 'def', 'function', 'C', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'Which of the following Python data types is mutable?', 'tuple', 'list', 'string', 'int', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'What is the output of the list comprehension: [x*2 for x in range(3)]?', '[0, 2, 4]', '[2, 4, 6]', '[0, 1, 2]', '[0, 4, 8]', 'A', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'SUBJECTIVE', 'What is the Global Interpreter Lock (GIL) in CPython, and how does it impact multi-threaded CPU-bound programs?', NULL, NULL, NULL, NULL, NULL, 'HARD', 10, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'Which keyword is used in a Python function to turn it into a generator?', 'return', 'send', 'yield', 'next', 'C', 'MEDIUM', 3, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'TRUE_FALSE', 'PEP 8 is the official style guide for writing clean Python code.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'Which of the following cannot be used as a dictionary key in Python?', 'string', 'tuple', 'list', 'integer', 'C', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'What is the purpose of the ''self'' parameter in Python class methods?', 'It acts as a placeholder', 'It refers to the current instance of the class', 'It is a constructor name', 'It calls the superclass method', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'SUBJECTIVE', 'Explain the concept of decorators in Python and write a simple example of a decorator that prints log messages when a function is called.', NULL, NULL, NULL, NULL, NULL, 'HARD', 5, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'What is the output of print("Python"[-2:])?', 'on', 'ho', 'th', 'Py', 'A', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'TRUE_FALSE', 'Python uses reference counting and a cyclic garbage collector for memory management.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'Which block is executed in Python regardless of whether an exception occurred or not?', 'except', 'catch', 'finally', 'else', 'C', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'SUBJECTIVE', 'Explain the difference and usage of *args and **kwargs in Python function parameters.', NULL, NULL, NULL, NULL, NULL, 'MEDIUM', 5, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'What is the output of 7 // 2 in Python?', '3.5', '3', '4', '3.0', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'What is the purpose of the ''pass'' statement in Python?', 'It terminates a loop immediately', 'It is a null operation placeholder', 'It skips to the next loop iteration', 'It raises a StopIteration exception', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'TRUE_FALSE', 'Python enforces strict private variable encapsulation using compiler checks.', 'TRUE', 'FALSE', NULL, NULL, 'FALSE', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'How do you add an element to the end of a list in Python?', 'add()', 'insert()', 'append()', 'push()', 'C', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'SUBJECTIVE', 'Explain why virtual environments (like venv) are used in Python development.', NULL, NULL, NULL, NULL, NULL, 'EASY', 5, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'MCQ', 'Which of the following defines an anonymous lambda function in Python?', 'lambda x: x*x', 'def lambda(x): x*x', 'func(x) => x*x', 'anonymous x: x*x', 'A', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Python'), 'TRUE_FALSE', 'Python supports conditional expressions using syntax like: x = 5 if condition else 10.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'EASY', 2, 1);

-- Seed 20 questions for Operating Systems
INSERT INTO questions (topic_id, type, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, marks, created_by)
VALUES
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'SUBJECTIVE', 'What is the fundamental difference between a Process and a Thread in an operating system?', NULL, NULL, NULL, NULL, NULL, 'MEDIUM', 5, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'MCQ', 'Which hardware component is responsible for translating virtual addresses to physical addresses?', 'ALU', 'MMU', 'Cache Controller', 'DMAC', 'B', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'MCQ', 'Which of the following is NOT one of Coffman''s four conditions for deadlock?', 'Mutual Exclusion', 'Hold and Wait', 'Preemption', 'Circular Wait', 'C', 'HARD', 3, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'MCQ', 'What is a page fault?', 'An error in disk write operation', 'An interrupt raised when a program accesses a page not mapped in RAM', 'A hardware memory module crash', 'A file index mismatch', 'B', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'SUBJECTIVE', 'Compare the architectures of Monolithic Kernels and Microkernels in terms of performance, size, and system security.', NULL, NULL, NULL, NULL, NULL, 'HARD', 10, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'MCQ', 'Which CPU scheduling algorithm is non-preemptive and selects the process with the shortest execution time?', 'Round Robin', 'Shortest Job First', 'Priority Scheduling', 'Shortest Remaining Time First', 'B', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'TRUE_FALSE', 'Thrashing occurs when an operating system spends more time swapping pages in and out of disk than executing processes.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'MCQ', 'What is context switching in an operating system?', 'Switching between fullscreen and windowed modes', 'Saving the state of a CPU process to load and run another process', 'Moving a file from memory to disk', 'Redirecting network packets', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'SUBJECTIVE', 'Describe the difference between a Binary Semaphore and a Mutex.', NULL, NULL, NULL, NULL, NULL, 'HARD', 5, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'MCQ', 'What does SPOOL stands for?', 'System Pool of On-line Operations', 'Simultaneous Peripheral Operations On-Line', 'Single Port Output Line', 'Shared Processor Output On-Line', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'MCQ', 'What is a critical section in concurrency?', 'A section of code that must execute in parallel', 'A segment of code accessing shared resources that must not be concurrently accessed', 'A memory region for OS kernel storage', 'A backup partition', 'B', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'TRUE_FALSE', 'First-Come, First-Served (FCFS) CPU scheduling always prevents starvation.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'MCQ', 'What is the purpose of the ''dirty bit'' in a page table?', 'To indicate page validation errors', 'To indicate if the page has been modified since it was loaded into RAM', 'To label read-only pages', 'To flag corrupt memory sectors', 'B', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'SUBJECTIVE', 'Explain Belady''s Anomaly and name a page replacement algorithm that suffers from it.', NULL, NULL, NULL, NULL, NULL, 'HARD', 5, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'MCQ', 'Which component interacts directly with the computer hardware in a standard OS?', 'Shell', 'Kernel', 'Compiler', 'Desktop Environment', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'TRUE_FALSE', 'RAID 1 configuration uses disk striping to double memory read throughput without redundancy.', 'TRUE', 'FALSE', NULL, NULL, 'FALSE', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'MCQ', 'What is the return value of fork() in the child process in UNIX?', 'Parent PID', 'Child PID', '0', '-1', 'C', 'MEDIUM', 3, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'SUBJECTIVE', 'Explain the difference between user mode and kernel mode and how system calls bridge them.', NULL, NULL, NULL, NULL, NULL, 'MEDIUM', 5, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'MCQ', 'Which CPU scheduling algorithm is most prone to process starvation?', 'Round Robin', 'FCFS', 'Priority Scheduling', 'Shortest Job First with short new processes', 'C', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Operating Systems'), 'TRUE_FALSE', 'The maximum amount of virtual memory is limited solely by the size of physical RAM.', 'TRUE', 'FALSE', NULL, NULL, 'FALSE', 'EASY', 2, 1);

-- Seed 20 questions for Computer Networks
INSERT INTO questions (topic_id, type, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, marks, created_by)
VALUES
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'MCQ', 'Which layer of the OSI model is responsible for routing IP packets?', 'Data Link', 'Network', 'Transport', 'Session', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'SUBJECTIVE', 'Contrast TCP and UDP in terms of reliability, speed, and header size.', NULL, NULL, NULL, NULL, NULL, 'MEDIUM', 5, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'MCQ', 'Which port is typically used by the Domain Name System (DNS)?', '53', '80', '443', '21', 'A', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'MCQ', 'What is the correct sequence of TCP flags sent during a connection setup?', 'SYN -> SYN-ACK -> ACK', 'SYN -> ACK -> SYN-ACK', 'ACK -> SYN -> SYN-ACK', 'SYN -> ACK-SYN -> ACK', 'A', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'SUBJECTIVE', 'Explain the purpose of a Subnet Mask and calculate the number of usable host IPs in a standard /24 subnet.', NULL, NULL, NULL, NULL, NULL, 'HARD', 5, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'MCQ', 'Which HTTP status code represents ''Internal Server Error''?', '400', '401', '404', '500', 'D', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'TRUE_FALSE', 'A MAC address is a physical identifier embedded in a Network Interface Card and is 48 bits long.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'MCQ', 'What is the primary purpose of DHCP?', 'Encrypting network packets', 'Automatically assigning IP addresses to clients', 'Translating domain names to IPs', 'Routing packets between networks', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'SUBJECTIVE', 'Explain how NAT (Network Address Translation) works and why it is crucial for preserving IPv4 address space.', NULL, NULL, NULL, NULL, NULL, 'HARD', 5, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'MCQ', 'Which protocol encrypts web traffic using SSL/TLS?', 'HTTP', 'HTTPS', 'FTP', 'SMTP', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'MCQ', 'What is the bit size of an IPv6 address?', '32 bits', '64 bits', '128 bits', '256 bits', 'C', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'TRUE_FALSE', 'ARP (Address Resolution Protocol) is used to map a known MAC address to its corresponding IP address.', 'TRUE', 'FALSE', NULL, NULL, 'FALSE', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'MCQ', 'What is a default gateway?', 'A firewall security setting', 'The router IP address that connects a local network to external networks', 'The domain name of the local network', 'A DNS caching server', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'SUBJECTIVE', 'List three application layer protocols in the TCP/IP stack.', NULL, NULL, NULL, NULL, NULL, 'EASY', 5, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'MCQ', 'Which utility uses ICMP Echo Request and Echo Reply messages?', 'FTP', 'ping', 'ssh', 'dig', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'TRUE_FALSE', 'The IP address 192.168.1.1 is classified as a public IP address.', 'TRUE', 'FALSE', NULL, NULL, 'FALSE', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'MCQ', 'Which protocol is commonly used to secure Wi-Fi networks today?', 'HTTP', 'WPA3', 'SMTP', 'FTP', 'B', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'SUBJECTIVE', 'What is the purpose of CSMA/CD in traditional Ethernet networks?', NULL, NULL, NULL, NULL, NULL, 'HARD', 5, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'MCQ', 'Which of these is an exterior gateway routing protocol used to route traffic between autonomous systems?', 'OSPF', 'RIP', 'BGP', 'EIGRP', 'C', 'HARD', 3, 1),
((SELECT id FROM topics WHERE name = 'Computer Networks'), 'TRUE_FALSE', 'A TTL (Time to Live) value in a DNS record specifies how long a DNS resolver should cache that record.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'MEDIUM', 2, 1);

-- Seed 20 questions for JavaScript
INSERT INTO questions (topic_id, type, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, marks, created_by)
VALUES
((SELECT id FROM topics WHERE name = 'JavaScript'), 'MCQ', 'Which keyword creates a block-scoped variable that cannot be reassigned in JavaScript?', 'var', 'let', 'const', 'def', 'C', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'SUBJECTIVE', 'Explain what a Closure is in JavaScript and provide a short code example of its usage.', NULL, NULL, NULL, NULL, NULL, 'HARD', 10, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'MCQ', 'What is the output of print(5 == "5") and print(5 === "5")?', 'true and true', 'true and false', 'false and false', 'false and true', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'SUBJECTIVE', 'Describe how the JavaScript Event Loop manages the Execution Stack, Callback Queue, and Microtask Queue.', NULL, NULL, NULL, NULL, NULL, 'HARD', 10, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'MCQ', 'What is the result of typeof NaN and NaN === NaN?', 'number and false', 'NaN and true', 'undefined and false', 'object and false', 'A', 'HARD', 3, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'TRUE_FALSE', 'Strict Mode ("use strict") forces JavaScript to throw runtime exceptions for silent errors.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'MCQ', 'What is the state of a Promise when it is first initialized?', 'resolved', 'rejected', 'pending', 'fulfilled', 'C', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'SUBJECTIVE', 'Explain the concept of Prototypal Inheritance in JavaScript.', NULL, NULL, NULL, NULL, NULL, 'MEDIUM', 5, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'MCQ', 'Which array method creates a new array containing all elements that pass a test function?', 'map()', 'filter()', 'reduce()', 'every()', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'MCQ', 'What does ''this'' refer to in a regular function invoked as a method of an object?', 'The global window object', 'The object that owns the method', 'undefined', 'The function itself', 'B', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'TRUE_FALSE', 'Arrow functions in JavaScript bind their own lexical ''this'' context dynamically.', 'TRUE', 'FALSE', NULL, NULL, 'FALSE', 'MEDIUM', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'SUBJECTIVE', 'Distinguish between null and undefined in JavaScript.', NULL, NULL, NULL, NULL, NULL, 'EASY', 5, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'MCQ', 'What is Event Delegation in the DOM?', 'Assigning event listeners to children', 'Handling events at a parent level using event bubbling', 'Stopping event propagation', 'Dispatching custom browser events', 'B', 'MEDIUM', 3, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'TRUE_FALSE', 'An async function in JavaScript always returns a Promise.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'MCQ', 'How long does data stored in localStorage persist?', 'Until the browser tab is closed', 'Permanently until explicitly deleted', 'For 24 hours', 'For the current session only', 'B', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'SUBJECTIVE', 'Explain what an IIFE (Immediately Invoked Function Expression) is and why it is used.', NULL, NULL, NULL, NULL, NULL, 'MEDIUM', 5, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'MCQ', 'Which selector is used to select elements by class name in querySelector?', '.classname', '#classname', 'classname', '@classname', 'A', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'TRUE_FALSE', 'event.stopPropagation() prevents the event from bubbling up the DOM tree.', 'TRUE', 'FALSE', NULL, NULL, 'TRUE', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'MCQ', 'What is the syntax for the spread operator in ES6?', '...', '..', '---', '@@@', 'A', 'EASY', 2, 1),
((SELECT id FROM topics WHERE name = 'JavaScript'), 'TRUE_FALSE', 'Under strict equality (===), null === undefined evaluates to true.', 'TRUE', 'FALSE', NULL, NULL, 'FALSE', 'EASY', 2, 1);
